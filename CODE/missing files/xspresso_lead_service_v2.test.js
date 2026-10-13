import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from './xspresso_json_store.js';
import { LeadService } from './xspresso_lead_service_v1.js';

async function setup(t) {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-leads-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = new JsonStore(join(dir, 'db.json'));
  await store.init();
  const user = { id: 'u1', tenantId: 't1' };
  await store.update(state => state.campaigns.push({ id: 'c1', tenantId: 't1', name: 'Test' }));
  return { store, user, service: new LeadService({ store, clock: () => Date.parse('2026-10-09T12:00:00Z') }) };
}

test('lead capture requires consent and validates email', async t => {
  const { service, user } = await setup(t);
  await assert.rejects(service.capture(user, { email: 'lead@example.com' }), { code: 'CONSENT_REQUIRED' });
  await assert.rejects(service.capture(user, { email: 'not-an-email', consent: true }), { code: 'INVALID_EMAIL' });
});

test('lead capture is idempotent per account, email, and campaign', async t => {
  const { service, user } = await setup(t);
  const first = await service.capture(user, { email: 'Lead@Example.com', campaignId: 'c1', consent: true });
  const second = await service.capture(user, { email: 'lead@example.com', campaignId: 'c1', consent: true });
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(first.lead.id, second.lead.id);
  const listed = await service.list(user, { campaignId: 'c1' });
  assert.equal(listed.leads.length, 1);
});

test('tenant boundaries hide other accounts\' leads', async t => {
  const { service, user } = await setup(t);
  const saved = await service.capture(user, { email: 'lead@example.com', consent: true });
  await assert.rejects(service.addTimelineEvent({ id: 'u2', tenantId: 't2' }, saved.lead.id, { type: 'note' }), { code: 'LEAD_NOT_FOUND' });
});
