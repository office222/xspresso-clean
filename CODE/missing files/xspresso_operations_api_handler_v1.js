/** Authenticated endpoints for campaign monitoring, alerts, and follow-up enrollment. */
export function createOperationsApiHandler({ auth, monitoringWorker, alertRepository, followups, fallback, bodyLimitBytes = 256_000 } = {}) {
  if (!auth || typeof fallback !== 'function') throw new TypeError('auth and fallback are required.');
  return async function handle(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    const method = String(req.method || 'GET').toUpperCase();
    const monitor = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/monitor$/);
    const resolve = url.pathname.match(/^\/api\/alerts\/([A-Za-z0-9_-]+)\/resolve$/);
    const enroll = url.pathname.match(/^\/api\/leads\/([A-Za-z0-9_-]+)\/followups$/);
    const isAlerts = url.pathname === '/api/alerts';
    const known = Boolean(monitor || resolve || enroll || isAlerts);
    if (!known) return fallback(req, res);
    const allowed = monitor ? ['POST'] : resolve ? ['POST'] : enroll ? ['POST'] : isAlerts ? ['GET'] : [];
    if (!allowed.includes(method)) { res.setHeader?.('allow', allowed.join(', ')); return send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: `Use ${allowed.join(' or ')}.` }); }

    try {
      const token = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(req.headers?.authorization || '')?.[1] || '';
      const user = await auth.authenticate(token);
      if (!user?.id || !user?.tenantId) return send(res, 401, { error: 'UNAUTHORIZED', message: 'Sign in to continue.' });

      if (monitor) {
        if (typeof monitoringWorker?.run !== 'function') return send(res, 503, { error: 'MONITORING_UNAVAILABLE', message: 'Monitoring is not configured.' });
        const body = await readJson(req, bodyLimitBytes);
        const result = await monitoringWorker.run({ tenantId: user.tenantId, campaignId: monitor[1], thresholds: body.thresholds || {} });
        return send(res, 200, result);
      }
      if (isAlerts) {
        if (typeof alertRepository?.list !== 'function') return send(res, 503, { error: 'ALERTS_UNAVAILABLE', message: 'Alerts are not configured.' });
        const status = url.searchParams.get('status') || undefined;
        if (status && !['open', 'resolved'].includes(status)) return send(res, 400, { error: 'INVALID_STATUS', message: 'status must be open or resolved.' });
        const rawLimit = Number(url.searchParams.get('limit') || 50);
        if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 200) return send(res, 400, { error: 'INVALID_LIMIT', message: 'limit must be an integer from 1 to 200.' });
        return send(res, 200, { alerts: await alertRepository.list({ tenantId: user.tenantId, status, limit: rawLimit }) });
      }
      if (resolve) {
        if (typeof alertRepository?.resolve !== 'function') return send(res, 503, { error: 'ALERTS_UNAVAILABLE', message: 'Alerts are not configured.' });
        return send(res, 200, { alert: await alertRepository.resolve({ tenantId: user.tenantId, alertId: resolve[1], actorId: user.id }) });
      }
      if (enroll) {
        if (typeof followups?.enroll !== 'function') return send(res, 503, { error: 'FOLLOWUPS_UNAVAILABLE', message: 'Follow-up scheduling is not configured.' });
        const idempotencyKey = String(req.headers?.['idempotency-key'] || '');
        const body = await readJson(req, bodyLimitBytes);
        if (typeof body.campaignId !== 'string' || !body.campaignId) return send(res, 400, { error: 'CAMPAIGN_ID_REQUIRED', message: 'campaignId is required.' });
        const enrollment = await followups.enroll({ user, leadId: enroll[1], campaignId: body.campaignId, idempotencyKey });
        return send(res, 200, { enrollment });
      }
      return fallback(req, res);
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : 500;
      return send(res, status, { error: error?.code || 'INTERNAL_ERROR', message: status >= 500 ? 'The request could not be completed.' : error.message });
    }
  };
}

async function readJson(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += data.length;
    if (size > limit) throw Object.assign(new Error('Request body too large.'), { code: 'BODY_TOO_LARGE', status: 413 });
    chunks.push(data);
  }
  if (!size) return {};
  let value;
  try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Invalid JSON.'), { code: 'INVALID_JSON', status: 400 }); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('JSON object required.'), { code: 'INVALID_JSON', status: 400 });
  return value;
}
function send(res, status, value) {
  const text = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text), 'cache-control': 'no-store' });
  res.end(text);
}
