import { randomUUID } from 'node:crypto';

const RESERVED = new Set(['api', 'admin', 'auth', 'dashboard', 'login', 'signup', 'www', 'p']);
const MAX_BODY = 16_384;

export function createLandingPageHandler({ store, auth, fallback = () => false } = {}) {
  if (!store?.read || !store?.update || !auth?.authenticate) throw new TypeError('store and auth required');
  return async (req, res) => {
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    const method = (req.method || 'GET').toUpperCase();
    const publicMatch = /^\/p\/([a-z0-9-]{3,64})\/?$/.exec(path);
    if (publicMatch && method === 'GET') {
      const state = await store.read();
      const page = (state.landingPages || []).find(p => p.slug === publicMatch[1] && p.status === 'published');
      if (!page) return json(res, 404, { error: 'NOT_FOUND' });
      const html = renderLandingPage(page);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': Buffer.byteLength(html), 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'", 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' });
      return res.end(html);
    }
    if (!path.startsWith('/api/landing-pages')) return fallback(req, res);
    if (!/^\/api\/landing-pages(?:\/[a-f0-9-]{36}(?:\/(?:publish|unpublish))?)?$/.test(path)) return json(res, 404, { error: 'NOT_FOUND' });
    try {
      const token = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(req.headers.authorization || '')?.[1] || '';
      const user = await auth.authenticate(token);
      if (!user?.id || !user?.tenantId) return json(res, 401, { error: 'UNAUTHORIZED' });
      const match = /^\/api\/landing-pages\/([a-f0-9-]{36})(?:\/(publish|unpublish))?$/.exec(path);
      if (!match && method === 'GET') {
        const state = await store.read();
        return json(res, 200, { pages: (state.landingPages || []).filter(p => p.tenantId === user.tenantId).map(publicRecord) });
      }
      if (!match && method === 'POST') {
        const input = validate(await readBody(req));
        const now = new Date().toISOString();
        const page = { id: randomUUID(), tenantId: user.tenantId, ownerId: user.id, ...input, slug: null, status: 'draft', createdAt: now, updatedAt: now };
        await store.update(s => { s.landingPages ||= []; s.landingPages.push(page); });
        return json(res, 201, { page: publicRecord(page) });
      }
      if (!match) return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
      const [, id, action] = match;
      if (!action && method === 'GET') {
        const state = await store.read();
        const page = (state.landingPages || []).find(p => p.id === id && p.tenantId === user.tenantId);
        return page ? json(res, 200, { page: publicRecord(page) }) : json(res, 404, { error: 'NOT_FOUND' });
      }
      if (!action && method === 'PATCH') {
        const input = validate(await readBody(req));
        const page = await store.update(s => {
          const p = (s.landingPages || []).find(p => p.id === id && p.tenantId === user.tenantId);
          if (!p) return null;
          // An edit must be explicitly published again; it cannot silently change a live page.
          Object.assign(p, input, { slug: null, status: 'draft', updatedAt: new Date().toISOString() });
          return publicRecord(p);
        });
        return page ? json(res, 200, { page }) : json(res, 404, { error: 'NOT_FOUND' });
      }
      if (method === 'POST' && action) {
        const slug = action === 'publish' ? validateSlug((await readBody(req)).slug) : null;
        const result = await store.update(s => {
          const pages = s.landingPages || [];
          const page = pages.find(p => p.id === id && p.tenantId === user.tenantId);
          if (!page) return { error: 'NOT_FOUND', status: 404 };
          if (slug && pages.some(p => p.id !== id && p.slug === slug && p.status === 'published')) return { error: 'SLUG_TAKEN', status: 409 };
          page.slug = slug; page.status = slug ? 'published' : 'draft'; page.updatedAt = new Date().toISOString();
          return { page: publicRecord(page) };
        });
        return json(res, result.status || 200, result);
      }
      return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    } catch (e) { return json(res, e.status || 500, { error: e.status ? e.code : 'INTERNAL_ERROR' }); }
  };
}

function validate(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw fault('INVALID_INPUT', 400);
  const fields = { name: 120, seller: 120, headline: 180, description: 3000, cta: 60, price: 80, checkoutUrl: 2048, refundUrl: 2048 };
  for (const key of Object.keys(v)) if (![...Object.keys(fields), 'disclose'].includes(key)) throw fault('INVALID_INPUT', 400);
  const out = {};
  for (const [key, max] of Object.entries(fields)) {
    if (typeof v[key] !== 'string' || !v[key].trim() || v[key].length > max) {
      if ((key === 'price' || key === 'refundUrl') && !v[key]) { out[key] = ''; continue; }
      throw fault('INVALID_INPUT', 400);
    }
    out[key] = v[key].trim();
  }
  if (typeof v.disclose !== 'boolean') throw fault('INVALID_INPUT', 400);
  out.disclose = v.disclose;
  for (const key of ['checkoutUrl', 'refundUrl']) if (out[key]) {
    try { const url = new URL(out[key]); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Error(); out[key] = url.href; }
    catch { throw fault('INVALID_URL', 400); }
  }
  return out;
}
function validateSlug(v) { if (typeof v !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/.test(v) || RESERVED.has(v)) throw fault('INVALID_SLUG', 400); return v; }
function fault(code, status) { return Object.assign(new Error(code), { code, status }); }
async function readBody(req) {
  let bytes = 0, chunks = [];
  for await (const chunk of req) { bytes += chunk.length; if (bytes > MAX_BODY) throw fault('BODY_TOO_LARGE', 413); chunks.push(chunk); }
  try { const value = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(); return value; }
  catch { throw fault('INVALID_JSON', 400); }
}
function json(res, status, value) { const body = JSON.stringify(value); res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store' }); res.end(body); }
function publicRecord({ tenantId, ownerId, ...page }) { return page; }
const esc = v => String(v || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export function renderLandingPage(page) {
  const link = esc(page.checkoutUrl);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(page.name)}</title><style>body{font:18px/1.6 system-ui;margin:0;background:#f7f6f1;color:#111b34}main{max-width:700px;margin:5vh auto;background:white;padding:clamp(24px,6vw,60px);border-radius:18px}h1{font-size:clamp(36px,5vw,60px);line-height:1.1}.button{display:inline-block;background:#3d58e8;color:white;padding:14px 24px;border-radius:9px;text-decoration:none;font-weight:bold}small{color:#5d687d}</style></head><body><main><small>FROM ${esc(page.seller)}</small><h1>${esc(page.headline)}</h1><p>${esc(page.description)}</p><p><strong>${esc(page.price)}</strong></p><a class="button" href="${link}" rel="nofollow sponsored noopener noreferrer">${esc(page.cta)}</a>${page.disclose ? '<p><small>Disclosure: I may earn a commission if you buy through this link.</small></p>' : ''}<p><small>Payment and refunds are handled by ${esc(page.seller)}.${page.refundUrl ? ` <a href="${esc(page.refundUrl)}" rel="noopener noreferrer">Refund policy</a>` : ''}</small></p></main></body></html>`;
}
