import { randomUUID } from 'node:crypto';
import { validateGeneratedCampaign } from './xspresso_ai_output_validation_v1.js';

/** Tenant-scoped human review workflow. Approval never publishes or spends ad budget. */
export class CampaignReviewService {
  constructor({ store, clock = () => Date.now(), maxRevisionsPerCampaign = 50 } = {}) {
    if (!store || typeof store.read !== 'function' || typeof store.update !== 'function') throw new TypeError('store.read and store.update are required.');
    if (!Number.isInteger(maxRevisionsPerCampaign) || maxRevisionsPerCampaign < 1) throw new TypeError('maxRevisionsPerCampaign must be a positive integer.');
    this.store = store; this.clock = clock; this.maxRevisionsPerCampaign = maxRevisionsPerCampaign;
  }

  async getDraft({ user, campaignId } = {}) {
    const tenantId = requireTenant(user);
    const state = await this.store.read();
    const campaign = findCampaign(state, tenantId, campaignId);
    return {
      campaignId: campaign.id,
      draft: campaign.assets?.generatedDraft || null,
      version: Number.isInteger(campaign.draftVersion) ? campaign.draftVersion : 0,
      reviewStatus: campaign.reviewStatus || 'needs_review',
      approval: campaign.approval || null
    };
  }

  async saveDraft({ user, campaignId, expectedVersion, draft } = {}) {
    const tenantId = requireTenant(user);
    validateVersion(expectedVersion);
    const normalized = validateGeneratedCampaign(draft);
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      state.campaigns ||= []; state.campaignRevisions ||= []; state.auditEvents ||= [];
      const campaign = findCampaign(state, tenantId, campaignId);
      if (['active', 'published', 'running'].includes(campaign.status)) throw fault('CAMPAIGN_LOCKED', 'Pause or stop this campaign before editing its draft.', 409);
      const currentVersion = Number.isInteger(campaign.draftVersion) ? campaign.draftVersion : 0;
      if (expectedVersion !== currentVersion) throw fault('DRAFT_VERSION_CONFLICT', 'The draft changed since it was loaded. Refresh and reapply your edits.', 409, { currentVersion });
      const version = currentVersion + 1;
      campaign.assets ||= {};
      campaign.assets.generatedDraft = normalized;
      campaign.draftVersion = version;
      campaign.reviewStatus = 'needs_review';
      campaign.approval = null;
      campaign.updatedAt = now;
      state.campaignRevisions.push({ id: randomUUID(), tenantId, campaignId, version, kind: 'edited', draft: structuredClone(normalized), actorId: user.id, createdAt: now });
      pruneRevisions(state.campaignRevisions, campaignId, tenantId, this.maxRevisionsPerCampaign);
      state.auditEvents.push({ id: randomUUID(), tenantId, actorId: user.id, action: 'campaign.draft_saved', resourceType: 'campaign', resourceId: campaignId, version, createdAt: now });
      return { campaignId, draft: normalized, version, reviewStatus: campaign.reviewStatus };
    });
  }

  async approveDraft({ user, campaignId, expectedVersion } = {}) {
    const tenantId = requireTenant(user);
    validateVersion(expectedVersion);
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      state.campaigns ||= []; state.campaignRevisions ||= []; state.auditEvents ||= [];
      const campaign = findCampaign(state, tenantId, campaignId);
      if (['active', 'published', 'running'].includes(campaign.status)) throw fault('CAMPAIGN_LOCKED', 'This campaign is already active; approval state cannot be changed.', 409);
      const currentVersion = Number.isInteger(campaign.draftVersion) ? campaign.draftVersion : 0;
      if (expectedVersion !== currentVersion) throw fault('DRAFT_VERSION_CONFLICT', 'The draft changed since it was loaded. Refresh before approving.', 409, { currentVersion });
      const draft = campaign.assets?.generatedDraft;
      if (!draft) throw fault('DRAFT_NOT_FOUND', 'Generate or save a draft before approving it.', 409);
      const normalized = validateGeneratedCampaign(draft);
      campaign.assets.approvedDraft = structuredClone(normalized);
      campaign.reviewStatus = 'approved';
      campaign.approval = { approvedBy: user.id, approvedAt: now, draftVersion: currentVersion };
      campaign.updatedAt = now;
      state.campaignRevisions.push({ id: randomUUID(), tenantId, campaignId, version: currentVersion, kind: 'approved', draft: structuredClone(normalized), actorId: user.id, createdAt: now });
      pruneRevisions(state.campaignRevisions, campaignId, tenantId, this.maxRevisionsPerCampaign);
      state.auditEvents.push({ id: randomUUID(), tenantId, actorId: user.id, action: 'campaign.draft_approved', resourceType: 'campaign', resourceId: campaignId, version: currentVersion, createdAt: now });
      return { campaignId, version: currentVersion, reviewStatus: 'approved', approval: campaign.approval, draft: normalized };
    });
  }
}

function findCampaign(state, tenantId, campaignId) {
  const campaign = (state.campaigns || []).find(row => row.id === campaignId && row.tenantId === tenantId);
  if (!campaign) throw fault('CAMPAIGN_NOT_FOUND', 'Campaign not found.', 404);
  return campaign;
}
function pruneRevisions(rows, campaignId, tenantId, max) {
  const matching = rows.filter(row => row.campaignId === campaignId && row.tenantId === tenantId);
  for (const old of matching.slice(0, Math.max(0, matching.length - max))) {
    const index = rows.indexOf(old);
    if (index >= 0) rows.splice(index, 1);
  }
}
function requireTenant(user) {
  if (!user?.id || !user?.tenantId) throw fault('UNAUTHENTICATED', 'Authenticated user required.', 401);
  return user.tenantId;
}
function validateVersion(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw fault('INVALID_DRAFT_VERSION', 'expectedVersion must be a non-negative integer.', 400);
}
function fault(code, message, status, extra = {}) { return Object.assign(new Error(message), { code, status, ...extra }); }
