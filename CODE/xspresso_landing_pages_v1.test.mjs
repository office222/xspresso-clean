import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createLandingPageHandler } from './xspresso_landing_pages_v1.js';

function fixture() {
  let state = { landingPages: [] };
  const store = { read: async () => structuredClone(state), update: async cb => { const next = structuredClone(state); const result = cb(next); state = next; return structuredClone(result); } };
  const auth = { authenticate: async token => token === 'owner-a' ? { id: 'a', tenantId: 'a' } : token === 'owner-b' ? { id: 'b', tenantId: 'b' } : null };
  return { handler: createLandingPageHandler({ store, auth, fallback: (_req, res) => { res.writeHead(404); res.end(); } }), store };
}
const offer = { name: 'Book', seller: 'Craig', headline: 'A book', description: 'Details', cta: 'Read more', price: '$10', checkoutUrl: 'https://example.com/buy', refundUrl: '', disclose: false };
async function serving(handler, run) {
  const server = createServer((req, res) => Promise.resolve(handler(req, res)).catch(e => { res.writeHead(500); res.end(e.message); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const root = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, token, method = 'GET', body) => {
    const res = await fetch(root + path, { method, headers: { ...(token ? { authorization: 'Bearer ' + token } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text(); return { status: res.status, headers: res.headers, body: res.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text };
  };
  try { await run(request); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('draft is private; publish serves escaped HTML; unpublish removes public page', async () => {
  const { handler } = fixture();
  await serving(handler, async req => {
    assert.equal((await req('/api/landing-pages', null, 'POST', offer)).status, 401);
    const created = await req('/api/landing-pages', 'owner-a', 'POST', { ...offer, headline: '<script>alert(1)</script>' });
    assert.equal(created.status, 201);
    const id = created.body.page.id;
    assert.equal((await req('/api/landing-pages', 'owner-b')).body.pages.length, 0);
    assert.equal((await req('/api/landing-pages/' + id, 'owner-b')).status, 404);
    assert.equal((await req('/p/book')).status, 404);
    assert.equal((await req('/api/landing-pages/' + id + '/publish', 'owner-b', 'POST', { slug: 'book' })).status, 404);
    assert.equal((await req('/api/landing-pages/' + id + '/publish', 'owner-a', 'POST', { slug: 'book' })).status, 200);
    const publicPage = await req('/p/book');
    assert.equal(publicPage.status, 200);
    assert.match(publicPage.body, /&lt;script&gt;alert/);
    assert.doesNotMatch(publicPage.body, /<script>/);
    assert.match(publicPage.headers.get('content-security-policy'), /default-src 'none'/);
    assert.equal((await req('/api/landing-pages/' + id + '/unpublish', 'owner-a', 'POST', {})).status, 200);
    assert.equal((await req('/p/book')).status, 404);
  });
});

test('slug is unique across tenants; updates and dangerous URLs are rejected', async () => {
  const { handler } = fixture();
  await serving(handler, async req => {
    const a = (await req('/api/landing-pages', 'owner-a', 'POST', offer)).body.page.id;
    const b = (await req('/api/landing-pages', 'owner-b', 'POST', offer)).body.page.id;
    assert.equal((await req('/api/landing-pages/' + a + '/publish', 'owner-a', 'POST', { slug: 'my-book' })).status, 200);
    assert.equal((await req('/api/landing-pages/' + b + '/publish', 'owner-b', 'POST', { slug: 'my-book' })).status, 409);
    assert.equal((await req('/api/landing-pages/' + b + '/publish', 'owner-b', 'POST', { slug: 'api' })).status, 400);
    assert.equal((await req('/api/landing-pages/' + a, 'owner-b', 'PATCH', offer)).status, 404);
    assert.equal((await req('/api/landing-pages', 'owner-a', 'POST', { ...offer, checkoutUrl: 'javascript:alert(1)' })).status, 400);
    assert.equal((await req('/api/landing-pages/' + a, 'owner-a', 'PATCH', { ...offer, checkoutUrl: 'javascript:alert(1)' })).status, 400);
    assert.equal((await req('/p/my-book')).status, 200);
    assert.equal((await req('/api/landing-pages/' + a, 'owner-a', 'PATCH', { ...offer, headline: 'Updated draft' })).status, 200);
    assert.equal((await req('/p/my-book')).status, 404);
    assert.equal((await req('/api/landing-pages/' + a + '/publish', 'owner-a', 'POST', { slug: 'my-book' })).status, 200);
  });
});
