const json = (res, status, value) => { const body = JSON.stringify(value); res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(body) }); res.end(body); };
const readJson = async (req, limit) => { const chunks = []; let size = 0; for await (const c of req) { const b = Buffer.isBuffer(c) ? c : Buffer.from(c); size += b.length; if (size > limit) throw Object.assign(new Error('Body too large.'), { status: 413, code: 'BODY_TOO_LARGE' }); chunks.push(b); } if (!size) return {}; try { const x = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!x || typeof x !== 'object' || Array.isArray(x)) throw 0; return x; } catch { throw Object.assign(new Error('Invalid JSON.'), { status: 400, code: 'INVALID_JSON' }); } };

export function createCampaignHistoryApi({ auth, history, fallback, bodyLimitBytes = 500_000 } = {}) {
  if (!auth?.authenticate || !history?.list || !history?.get || !history?.restore || typeof fallback !== 'function') throw new TypeError('auth, history service, and fallback are required.');
  return async function handler(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    const list = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/revisions$/);
    const item = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/revisions\/([A-Za-z0-9_-]+)$/);
    const restore = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/revisions\/([A-Za-z0-9_-]+)\/restore$/);
    if (!list && !item && !restore) return fallback(req, res);
    const allowed = list || item ? ['GET'] : ['POST'];
    if (!allowed.includes(String(req.method).toUpperCase())) { res.setHeader?.('allow', allowed.join(', ')); return json(res, 405, { error: 'METHOD_NOT_ALLOWED' }); }
    try {
      const token = /^Bearer\s+([A-Za-z0-9_-]{20,512})$/i.exec(req.headers?.authorization || '')?.[1];
      const user = token ? await auth.authenticate(token) : null;
      if (!user) return json(res, 401, { error: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
      if (list) return json(res, 200, { revisions: await history.list({ user, campaignId: list[1] }) });
      if (item) return json(res, 200, await history.get({ user, campaignId: item[1], revisionId: item[2] }));
      const body = await readJson(req, bodyLimitBytes);
      return json(res, 200, await history.restore({ user, campaignId: restore[1], revisionId: restore[2], expectedVersion: body.expectedVersion }));
    } catch (e) {
      const status = Number.isInteger(e.status) ? e.status : 500;
      const out = { error: e.code || 'HISTORY_ERROR', message: status >= 500 ? 'The request could not be completed.' : e.message };
      if (Number.isSafeInteger(e.currentVersion)) out.currentVersion = e.currentVersion;
      return json(res, status, out);
    }
  };
}
