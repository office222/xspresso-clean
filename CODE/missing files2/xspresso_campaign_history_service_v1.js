import { randomUUID } from 'node:crypto';
import { validateGeneratedCampaign } from './xspresso_ai_output_validation_v1.js';

const fault = (status, code, message, extra = {}) => Object.assign(new Error(message), { status, code, ...extra });
const tenantOf = user => { if (!user?.id || !user?.tenantId) throw fault(401, 'UNAUTHENTICATED', 'Sign in to continue.'); return user.tenantId; };

/** Tenant-scoped revision history. Restores create a fresh draft version and always require re-approval. */
export class CampaignHistoryService {
  constructor({ store, clock = () => Date.now(), maxRevisionsPerCampaign = 50 } = {}) {
    if (!store?.read || !store?.update) throw new TypeError('store.read and store.update are required.');
    this.store = store; this.clock = clock; this.maxRevisionsPerCampaign = maxRevisionsPerCampaign;
  }

  async list({ user, campaignId } = {}) {
    const tenantId = tenantOf(user);
    const state = await this.store.read();
    this.#campaign(state, tenantId, campaignId);
    return (state.campaignRevisions || [])
      .filter(r => r.tenantId === tenantId && r.campaignId === campaignId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map(({ id, version, kind, actorId, createdAt, sourceRevisionId }) => ({ id, version, kind, actorId, createdAt, sourceRevisionId: sourceRevisionId || null }));
  }

  async get({ user, campaignId, revisionId } = {}) {
    const tenantId = tenantOf(user);
    const state = await this.store.read();
    this.#campaign(state, tenantId, campaignId);
    const revision = (state.campaignRevisions || []).find(r => r.id === revisionId && r.tenantId === tenantId && r.campaignId === campaignId);
    if (!revision) throw fault(404, 'REVISION_NOT_FOUND', 'Revision not found.');
    return structuredClone(revision);
  }

  async restore({ user, campaignId, revisionId, expectedVersion } = {}) {
    const tenantId = tenantOf(user);
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw fault(400, 'INVALID_DRAFT_VERSION', 'expectedVersion must be a non-negative integer.');
    const source = await this.get({ user, campaignId, revisionId });
    const restoredDraft = validateGeneratedCampaign(source.draft);
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      state.campaigns ||= []; state.campaignRevisions ||= []; state.auditEvents ||= [];
      const campaign = this.#campaign(state, tenantId, campaignId);
      if (['active', 'published', 'running'].includes(campaign.status)) throw fault(409, 'CAMPAIGN_LOCKED', 'Pause or stop the campaign before restoring a draft.');
      const current = Number.isSafeInteger(campaign.draftVersion) ? campaign.draftVersion : 0;
      if (current !== expectedVersion) throw fault(409, 'DRAFT_VERSION_CONFLICT', 'The draft changed. Refresh history and try again.', { currentVersion: current });
      const version = current + 1;
      campaign.assets ||= {};
      campaign.assets.generatedDraft = structuredClone(restoredDraft);
      campaign.draftVersion = version;
      campaign.reviewStatus = 'needs_review';
      campaign.approval = null;
      campaign.updatedAt = now;
      const revision = { id: randomUUID(), tenantId, campaignId, version, kind: 'restored', sourceRevisionId: source.id, draft: structuredClone(restoredDraft), actorId: user.id, createdAt: now };
      state.campaignRevisions.push(revision);
      const rows = state.campaignRevisions.filter(r => r.tenantId === tenantId && r.campaignId === campaignId);
      for (const old of rows.slice(0, Math.max(0, rows.length - this.maxRevisionsPerCampaign))) {
        const index = state.campaignRevisions.indexOf(old); if (index >= 0) state.campaignRevisions.splice(index, 1);
      }
      state.auditEvents.push({ id: randomUUID(), tenantId, actorId: user.id, action: 'campaign.draft_restored', resourceType: 'campaign', resourceId: campaignId, version, sourceRevisionId: source.id, createdAt: now });
      return { campaignId, revisionId: revision.id, sourceRevisionId: source.id, version, reviewStatus: campaign.reviewStatus, draft: restoredDraft };
    });
  }

  #campaign(state, tenantId, campaignId) {
    const campaign = (state.campaigns || []).find(c => c.id === campaignId && c.tenantId === tenantId);
    if (!campaign) throw fault(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found.');
    return campaign;
  }
}
