// xspresso_814_campaign_builder_screen_v3.js
// Campaign builder screen logic for Xspresso.

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || 'A product or service that needs a campaign.',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    templateType: input.templateType || 'basic',
    notes: input.notes || ''
  };
}

export function validateCampaignBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push('productName');
  if (!brief.offerDescription) missing.push('offerDescription');
  if (!brief.audience) missing.push('audience');
  return { valid: missing.length === 0, missing };
}

export function getDefaultCampaignDraft() {
  return {
    headline: 'Wake up your marketing.',
    subheadline: 'More responses. Less software chaos.',
    hooks: [],
    ads: [],
    landingPage: {},
    followUpEmails: [],
    platformVersions: {}
  };
}
