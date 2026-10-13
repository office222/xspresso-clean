// xspresso_721_review_actions.js
// Approve / edit / regenerate helpers.

import { updateCampaign } from './xspresso_720_campaign_store.js';

export function approveSection(campaignId, sectionName) {
  return updateCampaign(campaignId, {
    approvedSections: Array.from(new Set([...(getCampaignField(campaignId, 'approvedSections') || []), sectionName])),
  });
}

export function unapproveSection(campaignId, sectionName) {
  const approved = (getCampaignField(campaignId, 'approvedSections') || []).filter(
    (x) => x !== sectionName
  );
  return updateCampaign(campaignId, { approvedSections: approved });
}

export function regenerateSection(campaignId, sectionName, newValue) {
  const sectionKey = sectionName;
  return updateCampaign(campaignId, {
    [sectionKey]: newValue,
    lastRegeneratedSection: sectionName,
  });
}

export function approveAll(campaignId) {
  return updateCampaign(campaignId, { approvedSections: ['headline', 'subheadline', 'hooks', 'adCopy', 'landingPage'] });
}

function getCampaignField(campaignId, field) {
  // lazy require to avoid circular import issues in simple starter code
  const { getCampaign } = require('./xspresso_720_campaign_store.js');
  const campaign = getCampaign(campaignId);
  return campaign ? campaign[field] : null;
}
