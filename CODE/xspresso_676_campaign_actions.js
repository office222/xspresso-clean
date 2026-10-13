// xspresso_676_campaign_actions.js
// Campaign lifecycle helpers for Xspresso.

import { addCampaign, updateCampaign } from './xspresso_675_app_state_store.js';

export function createCampaignBrief(input = {}) {
  return {
    id: `cmp_${Date.now()}`,
    name: input.productName || 'Untitled Offer',
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    description: input.offerDescription || '',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    status: 'draft',
    approvedSections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveDraft(campaign) {
  const updated = { ...campaign, status: 'draft', updatedAt: new Date().toISOString() };
  addCampaign(updated);
  return updated;
}

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionName);
  const updated = {
    ...campaign,
    approvedSections: Array.from(approved),
    updatedAt: new Date().toISOString(),
  };
  return updateCampaign(campaign.id, updated);
}

export function regenerateSection(campaign, sectionName, value) {
  const updated = {
    ...campaign,
    [sectionName]: value,
    updatedAt: new Date().toISOString(),
  };
  return updateCampaign(campaign.id, updated);
}

export function launchCampaign(campaign) {
  const updated = {
    ...campaign,
    status: 'live',
    launchedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return updateCampaign(campaign.id, updated);
}

export function duplicateCampaign(campaign) {
  return {
    ...campaign,
    id: `cmp_${Date.now()}_copy`,
    name: `${campaign.name || 'Untitled'} Copy`,
    status: 'draft',
    approvedSections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
