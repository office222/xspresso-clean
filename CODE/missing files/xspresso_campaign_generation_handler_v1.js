/** Middleware for POST /api/campaigns/:id/generate; delegate all other routes. */
export function createCampaignGenerationHandler({ auth, generation, fallback, bodyLimitBytes = 1_000_000 } = {}) {
  if (!auth || !generation || typeof generation.generate !== 'function' || typeof fallback !== 'function') {
    throw new TypeError('auth, generation.generate, and fallback handler are required.');
  }
  return async function handle(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    const match = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/generate$/);
    if (!match || req.method !== 'POST') return fallback(req, res);
    try {
      const token = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(req.headers?.authorization || '')?.[1] || '';
      const user = await auth.authenticate(token);
      if (!user) return send(res, 401, { error: 'UNAUTHORIZED', message: 'Sign in to continue.' });
      const idempotencyKey = String(req.headers?.['idempotency-key'] || '');
      const body = await readJson(req, bodyLimitBytes);
      const result = await generation.generate({ user, campaignId: match[1], idempotencyKey, notes: body.notes || '' });
      return send(res, 200, result);
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : 500;
      const code = error.code || 'INTERNAL_ERROR';
      const message = status >= 500 ? (status === 502 ? error.message : 'The request could not be completed.') : error.message;
      return send(res, status, { error: code, message });
    }
  };
}

async function readJson(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw Object.assign(new Error('Request body is too large.'), { code: 'BODY_TOO_LARGE', status: 413 });
    chunks.push(buffer);
  }
  if (!size) return {};
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Request body must be valid JSON.'), { code: 'INVALID_JSON', status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Object.assign(new Error('Request body must be a JSON object.'), { code: 'INVALID_JSON', status: 400 });
  return body;
}
function send(res, status, data) {
  const payload = JSON.stringify(data);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload), 'cache-control': 'no-store' });
  res.end(payload);
}
