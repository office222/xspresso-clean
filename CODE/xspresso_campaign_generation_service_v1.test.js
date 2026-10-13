import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from './xspresso_json_store.js';
import { CreditLedgerService } from './xspresso_credit_ledger_service_v1.js';
import { CampaignGenerationService } from './xspresso_campaign_generation_service_v1.js';

const generated = {
  headline: 'A more considered routine', subheadline: 'Everyday care, made simple.', hooks: ['Make everyday care feel simpler.'],
  ads: [{ headline: 'Simple care for every day', primaryText: 'Discover an option for your daily routine.', callToAction: 'Learn more' }],
  landingPage: { headline: 'Simple care for every day', body: 'Learn about the product and decide if it is right for you.', callToAction: 'Learn more' },
  followUpEmails: []
};

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-generation-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = new JsonStore(join(dir, 'data.json'));
  await store.init();
  const user = { id: 'user-1', tenantId: 'tenant-1', tone: 'friendly' };
  await store.update(state => { state.campaigns.push({ id: 'campaign-1', tenantId: user.tenantId, name: 'Test offer', goal: 'leads', platform: 'general', brief: { productName: 'Daily Lotion', offerDescription: 'A fragrance-free daily lotion.' }, assets: {} }); });
  const credits = new CreditLedgerService({ store });
  await credits.post({ tenantId: user.tenantId, kind: 'grant', credits: 100, reason: 'test grant', idempotencyKey: 'test-grant-001' });
  return { store, credits, user };
}

test('generates, stores, and charges once; repeated idempotency key replays result', async t => {
  const f = await fixture(t); let calls = 0;
  const service = new CampaignGenerationService({ ...f, provider: { async generate({ messages }) { calls++; assert.equal(messages[0].role, 'system'); return generated; } }, creditCost: 10 });
  const args = { user: f.user, campaignId: 'campaign-1', idempotencyKey: 'generation-test-001' };
  const first = await service.generate(args);
  const replay = await service.generate(args);
  assert.equal(first.creditsCharged, 10);
  assert.equal(replay.replayed, true);
  assert.equal(calls, 1);
  assert.equal((await f.credits.balance(f.user.tenantId)).balance, 90);
  const state = await f.store.read();
  assert.equal(state.campaigns[0].assets.generatedDraft.headline, generated.headline);
});

test('refunds a credit debit if provider output fails validation', async t => {
  const f = await fixture(t);
  const service = new CampaignGenerationService({ ...f, provider: { async generate() { return { headline: 'Incomplete' }; } }, creditCost: 10 });
  await assert.rejects(service.generate({ user: f.user, campaignId: 'campaign-1', idempotencyKey: 'generation-failure-01' }));
  assert.equal((await f.credits.balance(f.user.tenantId)).balance, 100);
});

test('rejects an unknown campaign and missing idempotency key', async t => {
  const f = await fixture(t);
  const service = new CampaignGenerationService({ ...f, provider: { async generate() { return generated; } }, creditCost: 10 });
  await assert.rejects(service.generate({ user: f.user, campaignId: 'missing', idempotencyKey: 'generation-test-001' }), { code: 'CAMPAIGN_NOT_FOUND' });
  await assert.rejects(service.generate({ user: f.user, campaignId: 'campaign-1' }), { code: 'IDEMPOTENCY_KEY_REQUIRED' });
});
