import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignReviewService } from './xspresso_campaign_review_service_v1.js';

const draft = {
  headline: 'A useful headline', subheadline: 'A concise supporting line', hooks: ['A clear hook'],
  ads: [{ headline: 'Try this today', primaryText: 'A factual product description.', callToAction: 'Learn more' }],
  landingPage: { headline: 'Welcome', body: 'Details about the product.', callToAction: 'Get started' },
  followUpEmails: [{ subject: 'Thanks for your interest', body: 'Here are the details.', delayDays: 1 }]
};
function fixture() {
  let state = { campaigns: [{ id: 'c1', tenantId: 't1', status: 'draft', assets: { generatedDraft: structuredClone(draft) } }] };
  const store = {
    read: async () => structuredClone(state),
    update: async fn => { const result = await fn(state); return structuredClone(result); }
  };
  return { store, state: () => state, service: new CampaignReviewService({ store, clock: () => Date.parse('2026-10-09T12:00:00.000Z') }) };
}
const user = { id: 'u1', tenantId: 't1' };

test('saveDraft validates, increments version, and requires the current version', async () => {
  const f = fixture();
  const changed = { ...structuredClone(draft), headline: 'Edited by the owner' };
  const saved = await f.service.saveDraft({ user, campaignId: 'c1', expectedVersion: 0, draft: changed });
  assert.equal(saved.version, 1);
  assert.equal(saved.reviewStatus, 'needs_review');
  await assert.rejects(() => f.service.saveDraft({ user, campaignId: 'c1', expectedVersion: 0, draft: changed }), error => error.code === 'DRAFT_VERSION_CONFLICT' && error.currentVersion === 1);
});

test('approval records actor and exact draft version, but does not publish', async () => {
  const f = fixture();
  const approved = await f.service.approveDraft({ user, campaignId: 'c1', expectedVersion: 0 });
  assert.equal(approved.reviewStatus, 'approved');
  assert.equal(approved.approval.approvedBy, 'u1');
  const campaign = f.state().campaigns[0];
  assert.equal(campaign.status, 'draft');
  assert.deepEqual(campaign.assets.approvedDraft, draft);
});

test('tenant isolation, active campaign lock, and invalid draft are rejected', async () => {
  const f = fixture();
  await assert.rejects(() => f.service.getDraft({ user: { id: 'u2', tenantId: 't2' }, campaignId: 'c1' }), error => error.status === 404);
  f.state().campaigns[0].status = 'active';
  await assert.rejects(() => f.service.saveDraft({ user, campaignId: 'c1', expectedVersion: 0, draft }), error => error.code === 'CAMPAIGN_LOCKED');
  f.state().campaigns[0].status = 'draft';
  await assert.rejects(() => f.service.saveDraft({ user, campaignId: 'c1', expectedVersion: 0, draft: { headline: '' } }), error => error.code === 'INVALID_GENERATION_OUTPUT');
});
