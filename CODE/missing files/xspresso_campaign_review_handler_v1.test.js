import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createCampaignReviewHandler } from './xspresso_campaign_review_handler_v1.js';
import { CampaignReviewService } from './xspresso_campaign_review_service_v1.js';

const draft = {
  headline: 'A useful headline', subheadline: '', hooks: [],
  ads: [{ headline: 'Try it', primaryText: 'A clear description.' }],
  landingPage: { headline: 'Welcome', body: 'Product information.' }, followUpEmails: []
};
function makeResponse() {
  return { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers); }, end(body) { this.body = body; } };
}
async function request(handler, path, method, body, token = 'session-ok') {
  const req = Readable.from(body === undefined ? [] : [JSON.stringify(body)]);
  req.url = path; req.method = method; req.headers = token ? { authorization: `Bearer ${token}` } : {};
  const res = makeResponse(); await handler(req, res); return { status: res.statusCode, headers: res.headers, body: JSON.parse(res.body) };
}
function makeHandler() {
  let state = { campaigns: [{ id: 'c1', tenantId: 't1', status: 'draft', assets: { generatedDraft: structuredClone(draft) } }] };
  const store = { read: async () => structuredClone(state), update: async fn => { const result = await fn(state); return structuredClone(result); } };
  const reviewService = new CampaignReviewService({ store });
  return createCampaignReviewHandler({ auth: { authenticate: async token => token === 'session-ok' ? { id: 'u1', tenantId: 't1' } : null }, reviewService, fallback: async (_req, res) => { res.writeHead(404); res.end('{}'); } });
}

test('review endpoints expose draft, edit it with version, then approve', async () => {
  const handler = makeHandler();
  const loaded = await request(handler, '/api/campaigns/c1/draft', 'GET');
  assert.equal(loaded.status, 200);
  assert.equal(loaded.body.version, 0);
  const saved = await request(handler, '/api/campaigns/c1/draft', 'PUT', { expectedVersion: 0, draft: { ...draft, headline: 'Edited' } });
  assert.equal(saved.body.version, 1);
  const approved = await request(handler, '/api/campaigns/c1/approve', 'POST', { expectedVersion: 1 });
  assert.equal(approved.body.reviewStatus, 'approved');
});

test('missing session is unauthorized and unknown paths reach fallback', async () => {
  const handler = makeHandler();
  const denied = await request(handler, '/api/campaigns/c1/draft', 'GET', undefined, 'bad');
  assert.equal(denied.status, 401);
  const missing = await request(handler, '/api/not-a-review-route', 'GET');
  assert.equal(missing.status, 404);
});
