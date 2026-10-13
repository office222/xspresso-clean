import test from 'node:test';
import assert from 'node:assert/strict';
import { FollowupDeliveryWorker } from './xspresso_followup_delivery_worker_v3.js';
import { UnsubscribeTokenService } from './xspresso_unsubscribe_tokens_v1.js';
import { UnsubscribeService } from './xspresso_unsubscribe_service_v1.js';
import { createUnsubscribeRoute } from './xspresso_unsubscribe_http_route_v1.js';

function memoryStore(initial) {
  let state = structuredClone(initial);
  return {
    async read() { return structuredClone(state); },
    async update(mutator) { const draft = structuredClone(state); const result = await mutator(draft); state = draft; return structuredClone(result); }
  };
}
const secret = 'local-test-secret-with-at-least-32-bytes';
function request(method, url, body = '') {
  const bytes = Buffer.from(body);
  return { method, url, async *[Symbol.asyncIterator]() { if (bytes.length) yield bytes; } };
}
function response() {
  return { headers: {}, writeHead(status, headers) { this.statusCode = status; Object.assign(this.headers, headers); }, end(body) { this.body = body; } };
}

test('delivery worker includes a signed unsubscribe link and stable provider idempotency key', async () => {
  const store = memoryStore({
    leads: [{ id: 'lead-1', tenantId: 'tenant-1', email: 'person@example.test', consent: true, status: 'active' }],
    followupEnrollments: [{ id: 'enroll-1', tenantId: 'tenant-1', leadId: 'lead-1', status: 'active', messages: [{ id: 'msg-1', subject: 'Hello', body: 'A useful note.', dueAt: '2026-10-09T11:00:00.000Z', status: 'scheduled', attempts: 0 }] }]
  });
  let delivered;
  const tokens = new UnsubscribeTokenService({ signingSecret: secret, clock: () => Date.parse('2026-10-09T12:00:00Z') });
  const worker = new FollowupDeliveryWorker({
    store, unsubscribeTokens: tokens, publicBaseUrl: 'https://example.test', clock: () => Date.parse('2026-10-09T12:00:00Z'),
    mailer: { async send(message) { delivered = message; return { id: 'provider-1' }; } }
  });
  const result = await worker.runOne();
  assert.equal(result.sent, true);
  assert.match(delivered.text, /api\/unsubscribe\?token=/);
  assert.equal(delivered.idempotencyKey, 'xspresso-followup-msg-1');
  assert.equal(tokens.verify(new URL(delivered.unsubscribeUrl).searchParams.get('token')).leadId, 'lead-1');
});

test('unsubscribe GET shows confirmation without mutating; POST applies the opt-out', async () => {
  const store = memoryStore({ leads: [{ id: 'lead-1', tenantId: 'tenant-1', consent: true, status: 'active' }], followupEnrollments: [], auditEvents: [] });
  const tokens = new UnsubscribeTokenService({ signingSecret: secret, clock: () => Date.now() });
  const service = new UnsubscribeService({ store, tokenService: tokens });
  const route = createUnsubscribeRoute({ unsubscribeService: service, tokenService: tokens });
  const token = tokens.issue({ tenantId: 'tenant-1', leadId: 'lead-1' });
  const getResponse = response();
  await route(request('GET', `/api/unsubscribe?token=${encodeURIComponent(token)}`), getResponse);
  assert.equal(getResponse.statusCode, 200);
  assert.match(getResponse.body, /Confirm/);
  assert.equal((await store.read()).leads[0].status, 'active');
  const postResponse = response();
  await route(request('POST', '/api/unsubscribe', new URLSearchParams({ token }).toString()), postResponse);
  assert.equal(postResponse.statusCode, 200);
  assert.equal((await store.read()).leads[0].status, 'unsubscribed');
});
