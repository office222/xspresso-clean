import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createCoreApiHandler } from './xspresso_core_api_v2.js';

function context(state = {}) {
  const db = { ...state };
  const store = {
    async read() { return structuredClone(db); },
    async update(fn) { const result = await fn(db); return structuredClone(result); }
  };
  const user = { id: 'u1', tenantId: 't1', email: 'owner@example.test' };
  const auth = { async authenticate(token) { return token === 'session-token-1234567890123456789012345678901234567890' ? user : null; }, async logout() {} };
  const handler = createCoreApiHandler({ store, auth, config: { bodyLimitBytes: 4096, signupEnabled: true } });
  return { db, store, user, handler };
}
async function request(handler, path, { method = 'GET', body, token = 'session-token-1234567890123456789012345678901234567890' } = {}) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
  req.method = method; req.url = path; req.headers = token ? { authorization: `Bearer ${token}` } : {};
  const result = { headers: {}, writeHead(status, headers) { this.status = status; Object.assign(this.headers, headers); }, end(payload) { this.body = String(payload || ''); } };
  await handler(req, result);
  return { status: result.status, headers: result.headers, body: result.body ? JSON.parse(result.body) : null };
}

test('credits balance includes the full tenant ledger, not only the visible page', async () => {
  const entries = [{ tenantId: 't1', kind: 'grant', credits: 500, createdAt: '2026-01-01T00:00:00.000Z' }];
  for (let i = 0; i < 100; i++) entries.push({ tenantId: 't1', kind: 'debit', credits: 1, createdAt: `2026-02-${String(i + 1).padStart(2, '0')}T00:00:00.000Z` });
  entries.push({ tenantId: 't2', kind: 'grant', credits: 1000, createdAt: '2026-03-01T00:00:00.000Z' });
  const { handler } = context({ creditLedger: entries });
  const response = await request(handler, '/api/credits');
  assert.equal(response.status, 200);
  assert.equal(response.body.balance, 400);
  assert.equal(response.body.entries.length, 100);
});

test('adding a lead with explicit consent reactivates the tenant-owned opted-out record', async () => {
  const lead = { id: 'lead1', tenantId: 't1', email: 'person@example.test', consent: false, optedOutAt: '2026-01-01T00:00:00.000Z', status: 'unsubscribed', events: [] };
  const { handler, db } = context({ leads: [lead], auditEvents: [] });
  const response = await request(handler, '/api/leads', { method: 'POST', body: { email: 'PERSON@example.test', consent: true, source: 'manual' } });
  assert.equal(response.status, 200);
  assert.equal(response.body.consentReconfirmed, true);
  assert.equal(db.leads[0].status, 'new');
  assert.equal(db.leads[0].optedOutAt, null);
  assert.equal(db.leads[0].events.at(-1).type, 'consent_reconfirmed');
});

test('campaign access remains tenant-scoped', async () => {
  const { handler } = context({ campaigns: [{ id: 'campaign1', tenantId: 't2', name: 'private' }] });
  const response = await request(handler, '/api/campaigns/campaign1');
  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'CAMPAIGN_NOT_FOUND');
});
