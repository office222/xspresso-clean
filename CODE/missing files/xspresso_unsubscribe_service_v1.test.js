import test from 'node:test';
import assert from 'node:assert/strict';
import { UnsubscribeTokenService } from './xspresso_unsubscribe_tokens_v1.js';
import { UnsubscribeService } from './xspresso_unsubscribe_service_v1.js';

function memoryStore(initial) {
  let state = structuredClone(initial);
  return {
    async read() { return structuredClone(state); },
    async update(mutator) { const draft = structuredClone(state); const result = await mutator(draft); state = draft; return structuredClone(result); }
  };
}
const secret = 'local-test-secret-with-at-least-32-bytes';

test('unsubscribe token is signed, scoped, and expires', () => {
  let now = Date.parse('2026-10-09T12:00:00Z');
  const tokens = new UnsubscribeTokenService({ signingSecret: secret, clock: () => now, ttlMs: 60_000 });
  const token = tokens.issue({ tenantId: 'tenant-1', leadId: 'lead-1' });
  assert.deepEqual(tokens.verify(token).tenantId, 'tenant-1');
  assert.throws(() => tokens.verify(`${token}x`), { code: 'INVALID_UNSUBSCRIBE_TOKEN' });
  now += 61_000;
  assert.throws(() => tokens.verify(token), { code: 'UNSUBSCRIBE_TOKEN_EXPIRED' });
});

test('unsubscribe clears consent and cancels pending follow-ups; repeat is safe', async () => {
  let now = Date.parse('2026-10-09T12:00:00Z');
  const store = memoryStore({
    leads: [{ id: 'lead-1', tenantId: 'tenant-1', email: 'person@example.test', consent: true, status: 'active' }],
    followupEnrollments: [{ id: 'enroll-1', tenantId: 'tenant-1', leadId: 'lead-1', status: 'active', messages: [{ id: 'msg-1', status: 'scheduled' }] }],
    auditEvents: []
  });
  const tokens = new UnsubscribeTokenService({ signingSecret: secret, clock: () => now });
  const service = new UnsubscribeService({ store, tokenService: tokens, clock: () => now });
  const token = tokens.issue({ tenantId: 'tenant-1', leadId: 'lead-1' });
  const first = await service.unsubscribe(token);
  const second = await service.unsubscribe(token);
  assert.equal(first.unsubscribed, true);
  assert.equal(second.alreadyUnsubscribed, true);
  const state = await store.read();
  assert.equal(state.leads[0].consent, false);
  assert.equal(state.leads[0].status, 'unsubscribed');
  assert.equal(state.followupEnrollments[0].messages[0].status, 'cancelled');
  assert.equal(state.auditEvents.length, 1);
});
