import { randomUUID } from 'node:crypto';
import { buildCampaignMessages } from './xspresso_ai_prompt_builder_v1.js';
import { validateGeneratedCampaign } from './xspresso_ai_output_validation_v1.js';

/** Provider-agnostic campaign generation with credit accounting and idempotency. */
export class CampaignGenerationService {
  constructor({ store, credits, provider, creditCost, clock = () => Date.now(), processingLeaseMs = 120_000 } = {}) {
    if (!store || !credits || !provider || typeof provider.generate !== 'function') throw new TypeError('store, credits, and a provider.generate function are required.');
    if (!Number.isSafeInteger(creditCost) || creditCost < 0) throw new TypeError('creditCost must be a non-negative integer configured by the server.');
    this.store = store; this.credits = credits; this.provider = provider; this.creditCost = creditCost;
    this.clock = clock; this.processingLeaseMs = processingLeaseMs;
  }

  async generate({ user, campaignId, idempotencyKey, notes = '' } = {}) {
    const tenantId = requireTenant(user);
    if (!/^[A-Za-z0-9._:-]{8,160}$/.test(String(idempotencyKey || ''))) throw fault('IDEMPOTENCY_KEY_REQUIRED', 'Provide an Idempotency-Key header of 8–160 safe characters.', 400);

    const claimId = randomUUID();
    const key = `${tenantId}:${campaignId}:${idempotencyKey}`;
    const claim = await this.store.update(state => {
      state.generationRequests ||= [];
      const campaign = state.campaigns.find(row => row.id === campaignId && row.tenantId === tenantId);
      if (!campaign) throw fault('CAMPAIGN_NOT_FOUND', 'Campaign not found.', 404);
      const prior = state.generationRequests.find(row => row.key === key);
      if (prior?.status === 'complete') return { replay: true, output: prior.output, campaignId };
      if (prior?.status === 'processing' && this.clock() - Date.parse(prior.updatedAt) < this.processingLeaseMs) {
        throw fault('GENERATION_IN_PROGRESS', 'This generation request is already running.', 409);
      }
      const now = new Date(this.clock()).toISOString();
      if (prior) Object.assign(prior, { status: 'processing', claimId, updatedAt: now, errorCode: null });
      else state.generationRequests.push({ id: randomUUID(), key, tenantId, campaignId, status: 'processing', claimId, createdAt: now, updatedAt: now, output: null });
      return { replay: false, claimId, brief: structuredClone(campaign.brief || {}), goal: campaign.goal, platform: campaign.platform };
    });
    if (claim.replay) return { campaignId, output: claim.output, replayed: true, creditsCharged: 0 };

    const chargeKey = `generation:${key}`;
    let charged = false;
    try {
      if (this.creditCost > 0) {
        await this.credits.post({ tenantId, actorId: user.id, kind: 'debit', credits: this.creditCost,
          reason: 'Campaign draft generation', referenceId: campaignId, idempotencyKey: chargeKey });
        charged = true;
      }
      const messages = buildCampaignMessages({ brief: { ...claim.brief, goal: claim.goal }, notes, tone: user.tone || 'simple', platform: claim.platform || 'general' });
      const raw = await this.provider.generate({ messages, campaignId, tenantId, responseFormat: 'json' });
      const output = validateGeneratedCampaign(raw);
      const now = new Date(this.clock()).toISOString();
      await this.store.update(state => {
        const request = state.generationRequests.find(row => row.key === key && row.claimId === claim.claimId && row.status === 'processing');
        const campaign = state.campaigns.find(row => row.id === campaignId && row.tenantId === tenantId);
        if (!request || !campaign) throw fault('GENERATION_LEASE_LOST', 'Generation could not be saved; retry with a new idempotency key.', 409);
        campaign.assets ||= {};
        campaign.assets.generatedDraft = output;
        campaign.updatedAt = now;
        request.status = 'complete'; request.output = output; request.updatedAt = now; request.errorCode = null;
        state.auditEvents ||= [];
        state.auditEvents.push({ id: randomUUID(), tenantId, actorId: user.id, action: 'campaign.generated', resourceType: 'campaign', resourceId: campaignId, outcome: 'success', createdAt: now });
      });
      return { campaignId, output, replayed: false, creditsCharged: this.creditCost };
    } catch (error) {
      if (charged) {
        try {
          await this.credits.post({ tenantId, actorId: user.id, kind: 'refund', credits: this.creditCost,
            reason: 'Refund for failed campaign generation', referenceId: campaignId, idempotencyKey: `refund:${chargeKey}` });
        } catch (refundError) { error.refundError = refundError.code || 'REFUND_FAILED'; }
      }
      await this.store.update(state => {
        const request = (state.generationRequests || []).find(row => row.key === key && row.claimId === claimId);
        if (request && request.status === 'processing') {
          request.status = 'failed'; request.updatedAt = new Date(this.clock()).toISOString();
          request.errorCode = error.code || 'GENERATION_FAILED';
        }
      });
      throw error;
    }
  }
}

function requireTenant(user) {
  if (!user?.id || !user?.tenantId) throw fault('UNAUTHENTICATED', 'Authenticated user required.', 401);
  return user.tenantId;
}
function fault(code, message, status) { return Object.assign(new Error(message), { code, status }); }
