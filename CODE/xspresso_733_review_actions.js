// xspresso_733_review_actions.js
// Review / approve / regenerate logic.

import { updateCampaign } from './xspresso_731_app_state_store.js';

export function approveSection(campaignId, sectionName) {
  updateCampaign(campaignId, (campaign) => campaign);
  return {
    campaignId,
    sectionName,
    action: 'approve',
    timestamp: new Date().toISOString()
  };
}

export function unapproveSection(campaignId, sectionName) {
  return {
    campaignId,
    sectionName,
    action: 'unapprove',
    timestamp: new Date().toISOString()
  };
}

export function regenerateSection(campaignId, sectionName, mode = 'balanced') {
  return {
    campaignId,
    sectionName,
    action: 'regenerate',
    mode,
    timestamp: new Date().toISOString(),
    message: `Regenerated ${sectionName} in ${mode} mode.`
  };
}

export function getReviewActions() {
  return ['approve', 'edit', 'regenerate', 'simplify', 'strengthen'];
}

export function createReviewState(campaign) {
  return {
    campaignId: campaign.id,
    approvedSections: campaign.approvedSections || [],
    pendingSections: [
      'headline',
      'subheadline',
      'hooks',
      'adCopy',
      'landingPage',
      'followUpEmails'
    ].filter((section) => !(campaign.approvedSections || []).includes(section))
  };
}
