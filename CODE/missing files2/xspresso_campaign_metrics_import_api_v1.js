import { createOperationsApiHandler } from './xspresso_operations_api_handler_v1.js';
import { composeXspressoApiV2 } from './xspresso_app_composition_v2.js';

/** Imports raw CSV as text, and exposes tenant-scoped imported metrics. */
export function createCampaignMetricsImportApi({ auth, importService, metricsProvider, fallback, bodyLimitBytes = 2_000_000 } = {}) {
  if (!auth || !importService || !metricsProvider || typeof fallback !== 'function') throw new TypeError('auth, importService, metricsProvider, and fallback are required.');
  return async function handle(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    const method = String(req.method || 'GET').toUpperCase();
    const metrics = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/metrics$/);
    const importMatch = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/metrics\/import$/);
    const link = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/link-external$/);
    if (!metrics && !importMatch && !link) return fallback(req, res);
    const allowed = metrics ? ['GET'] : ['POST'];
    if (!allowed.includes(method)) { res.setHeader?.('allow', allowed.join(', ')); return send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: `Use ${allowed.join(' or ')}.` }); }
    try {
      const token = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(req.headers?.authorization || '')?.[1] || '';
      const user = await auth.authenticate(token);
      if (!user?.id || !user?.tenantId) return send(res, 401, { error: 'UNAUTHORIZED', message: 'Sign in to continue.' });
      if (metrics) return send(res, 200, await metricsProvider.getCampaignMetrics({ tenantId: user.tenantId, campaignId: metrics[1] }));
      if (importMatch) {
        const type = String(req.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase();
        if (type !== 'text/csv') return send(res, 415, { error: 'CSV_CONTENT_TYPE_REQUIRED', message: 'Send this upload with Content-Type: text/csv.' });
        const csv = await readText(req, bodyLimitBytes);
        const result = await importService.importCsv({ user, campaignId: importMatch[1], csv, idempotencyKey: req.headers?.['idempotency-key'] });
        return send(res, 200, { import: result });
      }
      if (link) {
        const body = await readJson(req, 32_000);
        const campaign = await importService.linkExternalCampaign({ user, campaignId: link[1], platform: body.platform, externalCampaignId: body.externalCampaignId, confirmAlreadyLive: body.confirmAlreadyLive });
        return send(res, 200, { campaign });
      }
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : 500;
      return send(res, status, { error: error?.code || 'INTERNAL_ERROR', message: status >= 500 ? 'The request could not be completed.' : error.message });
    }
  };
}

/** Wrap the existing API stack without changing its route behavior. */
export function composeXspressoMetricsApi({ baseApi, auth, importService, metricsProvider, ...options } = {}) {
  const metricsApi = createCampaignMetricsImportApi({ auth, importService, metricsProvider, fallback: baseApi });
  return composeXspressoApiV2({ ...options, baseApi: metricsApi, auth });
}

/** Build a stack with monitoring/alerts and metrics import around an existing API. */
export function wrapMetricsAndMonitoringApi({ baseApi, auth, importService, metricsProvider, monitoringWorker, alertRepository, followups, bodyLimitBytes } = {}) {
  const metricsApi = createCampaignMetricsImportApi({ auth, importService, metricsProvider, fallback: baseApi, bodyLimitBytes });
  return createOperationsApiHandler({ auth, monitoringWorker, alertRepository, followups, fallback: metricsApi, bodyLimitBytes: Math.min(bodyLimitBytes || 256_000, 256_000) });
}

async function readText(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += data.length; if (size > limit) throw fault('BODY_TOO_LARGE', 413, 'CSV exceeds the allowed upload size.'); chunks.push(data); }
  return Buffer.concat(chunks).toString('utf8');
}
async function readJson(req, limit) {
  const text = await readText(req, limit);
  if (!text) return {};
  let value; try { value = JSON.parse(text); } catch { throw fault('INVALID_JSON', 400, 'Send valid JSON.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw fault('INVALID_JSON', 400, 'Send a JSON object.');
  return value;
}
function fault(code, status, message) { return Object.assign(new Error(message), { code, status }); }
function send(res, status, value) { const text = JSON.stringify(value); res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text), 'cache-control': 'no-store' }); res.end(text); }
