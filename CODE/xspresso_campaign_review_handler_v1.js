/** Review API middleware. Editing and approval do not publish campaigns. */
export function createCampaignReviewHandler({ auth, reviewService, fallback, bodyLimitBytes = 1_000_000 } = {}) {
  if (!auth || typeof reviewService?.getDraft !== 'function' || typeof reviewService?.saveDraft !== 'function' || typeof reviewService?.approveDraft !== 'function' || typeof fallback !== 'function') {
    throw new TypeError('auth, reviewService methods, and fallback are required.');
  }
  return async function handle(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    const method = String(req.method || 'GET').toUpperCase();
    const draft = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/draft$/);
    const approve = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/approve$/);
    if (!draft && !approve) return fallback(req, res);
    const allowed = draft ? ['GET', 'PUT'] : ['POST'];
    if (!allowed.includes(method)) { res.setHeader?.('allow', allowed.join(', ')); return send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: `Use ${allowed.join(' or ')}.` }); }

    try {
      const token = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(req.headers?.authorization || '')?.[1] || '';
      const user = await auth.authenticate(token);
      if (!user?.id || !user?.tenantId) return send(res, 401, { error: 'UNAUTHORIZED', message: 'Sign in to continue.' });
      const campaignId = draft?.[1] || approve?.[1];
      if (method === 'GET') return send(res, 200, await reviewService.getDraft({ user, campaignId }));
      const body = await readJson(req, bodyLimitBytes);
      if (method === 'PUT') return send(res, 200, await reviewService.saveDraft({ user, campaignId, expectedVersion: body.expectedVersion, draft: body.draft }));
      return send(res, 200, await reviewService.approveDraft({ user, campaignId, expectedVersion: body.expectedVersion }));
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : 500;
      const body = { error: error?.code || 'INTERNAL_ERROR', message: status >= 500 ? 'The request could not be completed.' : error.message };
      if (Number.isInteger(error?.currentVersion)) body.currentVersion = error.currentVersion;
      return send(res, status, body);
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
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('A JSON object is required.'), { code: 'INVALID_JSON', status: 400 });
  return value;
}
function send(res, status, value) {
  const text = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text), 'cache-control': 'no-store' });
  res.end(text);
}
