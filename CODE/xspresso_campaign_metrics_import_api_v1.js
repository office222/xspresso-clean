function send(res, status, payload, contentType = 'application/json; charset=utf-8') {
  const body = contentType.startsWith('application/json') ? JSON.stringify(payload) : payload;
  res.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store' }); res.end(body);
}
function tokenFrom(req) {
  const value = req.headers?.authorization || '';
  return /^Bearer\s+([A-Za-z0-9_-]{40,})$/.exec(value)?.[1] || '';
}
async function readBody(req, maxBytes) {
  const chunks = []; let length = 0;
  for await (const chunk of req) { length += chunk.length; if (length > maxBytes) throw Object.assign(new Error('Request body is too large.'), { status: 413, code: 'BODY_TOO_LARGE' }); chunks.push(chunk); }
  return Buffer.concat(chunks).toString('utf8');
}
async function readJson(req, maxBytes) {
  const text = await readBody(req, maxBytes);
  try { return JSON.parse(text || '{}'); } catch { throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400, code: 'INVALID_JSON' }); }
}

export function createCampaignMetricsImportApiHandler({ auth, importService, metricsProvider, fallback, bodyLimitBytes = 2 * 1024 * 1024 } = {}) {
  if (!auth || !importService || !metricsProvider || typeof fallback !== 'function') throw new TypeError('auth, importService, metricsProvider, and fallback are required.');
  return async function metricsImportApi(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    const match = /^\/api\/campaigns\/([A-Za-z0-9_-]+)\/metrics(?:\/(import))?$/.exec(url.pathname);
    const linkMatch = /^\/api\/campaigns\/([A-Za-z0-9_-]+)\/link-external$/.exec(url.pathname);
    if (!match && !linkMatch) return fallback(req, res);
    const user = await auth.authenticate(tokenFrom(req));
    if (!user) return send(res, 401, { error: 'Authentication required.', code: 'UNAUTHORIZED' });
    try {
      const campaignId = (match || linkMatch)[1];
      if (match && req.method === 'GET' && !match[2]) {
        const result = await metricsProvider.getCampaignMetrics({ tenantId: user.tenantId, campaignId });
        return send(res, 200, result);
      }
      if (match && req.method === 'POST' && match[2] === 'import') {
        const type = (req.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase();
        if (type !== 'text/csv') return send(res, 415, { error: 'Use Content-Type: text/csv.', code: 'UNSUPPORTED_MEDIA_TYPE' });
        const csv = await readBody(req, Math.min(bodyLimitBytes, 2 * 1024 * 1024));
        const result = await importService.importCsv({ user, campaignId, csv, idempotencyKey: req.headers?.['idempotency-key'] || '' });
        return send(res, result.replayed ? 200 : 201, result);
      }
      if (linkMatch && req.method === 'POST') {
        const body = await readJson(req, Math.min(bodyLimitBytes, 32 * 1024));
        const result = await importService.linkExternalCampaign({ user, campaignId, ...body });
        return send(res, 200, result);
      }
      return send(res, 405, { error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' });
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : 500;
      return send(res, status, { error: status >= 500 ? 'Metrics operation failed.' : error.message, code: error.code || 'METRICS_IMPORT_FAILED' });
    }
  };
}
