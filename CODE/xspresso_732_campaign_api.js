// xspresso_732_campaign_api.js
// Campaign creation and retrieval helpers for Xspresso.

import { addCampaign, updateCampaign } from './xspresso_731_app_state_store.js';

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || '',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    templateType: input.templateType || 'basic',
    notes: input.notes || ''
  };
}

export function createCampaignFromBrief(brief) {
  const campaign = {
    id: `cmp_${Date.now()}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    brief,
    headline: 'Wake up your marketing.',
    subheadline: 'More responses. Less software chaos.',
    approvedSections: [],
    regeneratedSections: []
  };

  addCampaign(campaign);
  return campaign;
}

export function saveCampaignDraft(campaignId, patch) {
  updateCampaign(campaignId, {
    ...patch,
    updatedAt: new Date().toISOString()
  });
}

export function getCampaignSummary(campaign) {
  return {
    id: campaign.id,
    name: campaign.brief?.productName || 'Untitled Campaign',
    status: campaign.status,
    platform: campaign.brief?.platform || 'general',
    updatedAt: campaign.updatedAt
  };
}

export function buildLaunchPayload(campaign) {
  return {
    campaignId: campaign.id,
    productName: campaign.brief?.productName || '',
    platform: campaign.brief?.platform || 'general',
    approvedSections: campaign.approvedSections || [],
    generatedAt: new Date().toISOString()
  };
}
