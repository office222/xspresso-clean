/** Adds authenticated Meta connect/status/disconnect routes and a state-protected OAuth callback. */
export function createMetaOAuthApiHandler({ auth, oauthService, vault, fallback, bodyLimitBytes = 32_000 } = {}) {
  if (!auth || typeof fallback !== 'function') throw new TypeError('auth and fallback are required.');
  return async function handle(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    const method = String(req.method || 'GET').toUpperCase();
    const callback = url.pathname === '/api/integrations/meta/callback';
    const connect = url.pathname === '/api/integrations/meta/connect';
    const status = url.pathname === '/api/integrations/meta/status';
    const disconnect = url.pathname === '/api/integrations/meta/connection';
    if (!callback && !connect && !status && !disconnect) return fallback(req, res);
    try {
      if (callback) {
        if (method !== 'GET') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Use GET.' }, { allow: 'GET' });
        if (!oauthService) return callbackPage(res, 503, false);
        try {
          await oauthService.complete({ state: url.searchParams.get('state'), code: url.searchParams.get('code'), providerError: url.searchParams.get('error') });
          res.writeHead(303, { location: '/?meta=connected', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' }); res.end();
        } catch (error) { return callbackPage(res, Number.isInteger(error?.status) ? error.status : 400, false); }
        return;
      }
      if (!['GET', 'POST', 'DELETE'].includes(method) || (connect && method !== 'POST') || (status && method !== 'GET') || (disconnect && method !== 'DELETE')) {
        return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Use the documented method for this endpoint.' });
      }
      const token = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(req.headers?.authorization || '')?.[1] || '';
      const user = await auth.authenticate(token);
      if (!user?.id || !user?.tenantId) return sendJson(res, 401, { error: 'UNAUTHORIZED', message: 'Sign in to continue.' });
      if (!vault) return sendJson(res, 503, { error: 'META_NOT_CONFIGURED', message: 'Meta credential encryption is not configured.' });
      if (connect) {
        if (!oauthService) return sendJson(res, 503, { error: 'META_OAUTH_NOT_CONFIGURED', message: 'Meta OAuth app settings are not configured.' });
        const body = await readJson(req, bodyLimitBytes);
        return sendJson(res, 200, await oauthService.begin({ user, adAccountId: body.adAccountId, currency: body.currency }));
      }
      if (status) {
        const connections = (await vault.list()).filter(item => item.tenantId === user.tenantId);
        return sendJson(res, 200, { connected: connections.length > 0, connections });
      }
      const result = await vault.remove(user.tenantId);
      return sendJson(res, 200, { disconnected: result.removed });
    } catch (error) {
      const code = error?.code || 'INTERNAL_ERROR'; const httpStatus = Number.isInteger(error?.status) ? error.status : 500;
      return sendJson(res, httpStatus, { error: code, message: httpStatus >= 500 ? 'The request could not be completed.' : error.message });
    }
  };
}
async function readJson(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += data.length; if (size > limit) throw Object.assign(new Error('Request body too large.'), { code: 'BODY_TOO_LARGE', status: 413 }); chunks.push(data); }
  if (!size) return {};
  try { const value = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; }
  catch { throw Object.assign(new Error('A JSON object is required.'), { code: 'INVALID_JSON', status: 400 }); }
}
function sendJson(res, status, value, extra = {}) { const text = JSON.stringify(value); res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text), 'cache-control': 'no-store', ...extra }); res.end(text); }
function callbackPage(res, status, success) { const title = success ? 'Meta connected' : 'Meta connection failed'; const body = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head><body><main><h1>${title}</h1><p>${success ? 'You can return to Xspresso.' : 'The connection could not be completed. Return to Xspresso and try again.'}</p><a href="/">Return to Xspresso</a></main></body></html>`; res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; style-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'", 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }); res.end(body); }
