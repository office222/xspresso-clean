import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { composeXspressoApiV2 } from './xspresso_app_composition_v2.js';

function res() { return { statusCode: 0, headers: {}, writeHead(code, headers = {}) { this.statusCode = code; Object.assign(this.headers, headers); }, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = body; } }; }
async function call(handler, url, method = 'GET', body, authorization = 'Bearer good') {
  const req = Readable.from(body === undefined ? [] : [JSON.stringify(body)]); req.url = url; req.method = method; req.headers = authorization ? { authorization } : {};
  const response = res(); await handler(req, response); return { status: response.statusCode, body: response.body || '' };
}

test('v2 composition routes review paths before the existing API and preserves fallback', async () => {
  let fallbackCalls = 0;
  const baseApi = async (_req, response) => { fallbackCalls += 1; response.writeHead(204); response.end(''); };
  const auth = { authenticate: async token => token === 'good' ? { id: 'u1', tenantId: 't1' } : null };
  const reviewService = {
    getDraft: async () => ({ campaignId: 'c1', draft: null, version: 0, reviewStatus: 'needs_review', approval: null }),
    saveDraft: async ({ expectedVersion }) => ({ version: expectedVersion + 1 }),
    approveDraft: async () => ({ reviewStatus: 'approved' })
  };
  const handler = composeXspressoApiV2({ baseApi, auth, reviewService });
  const draft = await call(handler, '/api/campaigns/c1/draft');
  assert.equal(draft.status, 200);
  const unknown = await call(handler, '/api/legacy');
  assert.equal(unknown.status, 204);
  assert.equal(fallbackCalls, 1);
});
