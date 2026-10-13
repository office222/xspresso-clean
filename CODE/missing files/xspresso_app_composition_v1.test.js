import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { composeXspressoApi } from './xspresso_app_composition_v1.js';

function capture() { return { status: 0, headers: {}, body: '', writeHead(status, headers) { this.status = status; this.headers = headers; }, setHeader(k, v) { this.headers[k] = v; }, end(body = '') { this.body = body; } }; }
async function call(handler, method, url, { token = 'session', body } = {}) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
  req.method = method; req.url = url; req.headers = token ? { authorization: `Bearer ${token}` } : {};
  const res = capture(); await handler(req, res); return res;
}

test('composition mounts public unsubscribe before authenticated fallbacks', async () => {
  let baseCalled = false, unsubscribed = false;
  const handler = composeXspressoApi({
    baseApi: async (_req, res) => { baseCalled = true; res.writeHead(404, {}); res.end('base'); },
    auth: { authenticate: async () => null },
    tokenService: { verify: token => { if (token !== 'signed-token') throw new Error('bad token'); return { leadId: 'l1' }; } },
    unsubscribeService: { unsubscribe: async () => { unsubscribed = true; } }
  });
  const page = await call(handler, 'GET', '/api/unsubscribe?token=signed-token', { token: '' });
  assert.equal(page.status, 200); assert.match(page.body, /method="post"/); assert.equal(baseCalled, false);
  const post = Readable.from([Buffer.from('token=signed-token')]);
  post.method = 'POST'; post.url = '/api/unsubscribe'; post.headers = { 'content-type': 'application/x-www-form-urlencoded' };
  const res = capture(); await handler(post, res);
  assert.equal(res.status, 200); assert.equal(unsubscribed, true); assert.equal(baseCalled, false);
});

test('generation endpoint is composed and unrelated requests fall through to base API', async () => {
  let baseCalled = false;
  const handler = composeXspressoApi({
    baseApi: async (_req, res) => { baseCalled = true; res.writeHead(200, { 'content-type': 'text/plain' }); res.end('base'); },
    auth: { authenticate: async token => token === 'session' ? { id: 'u1', tenantId: 't1' } : null },
    generation: { generate: async input => ({ campaignId: input.campaignId, output: { headline: 'Hello' } }) }
  });
  const generated = await call(handler, 'POST', '/api/campaigns/c1/generate', { body: {}, token: 'session' });
  assert.equal(generated.status, 200); assert.equal(JSON.parse(generated.body).campaignId, 'c1'); assert.equal(baseCalled, false);
  const other = await call(handler, 'GET', '/api/health');
  assert.equal(other.status, 200); assert.equal(other.body, 'base'); assert.equal(baseCalled, true);
});
