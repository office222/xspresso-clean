// xspresso_550_campaign_builder_core.js
// Core campaign builder scaffolding for Xspresso V1.

export const defaultCampaignState = {
  id: null,
  status: 'draft',
  productName: '',
  productUrl: '',
  productImage: '',
  offerDescription: '',
  audience: '',
  goal: 'sales',
  tone: 'simple',
  platforms: [],
  sections: {
    headline: '',
    subheadline: '',
    hooks: [],
    adCopy: [],
    landingPage: '',
    shoppingCart: '',
    leadMagnet: '',
    followUpEmails: [],
    platformVersions: {}
  },
  approvedSections: [],
  createdAt: null,
  updatedAt: null
};

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || '',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platforms: Array.isArray(input.platforms) ? input.platforms : [],
    notes: input.notes || ''
  };
}

export function applySmartDefaults(brief) {
  return {
    ...brief,
    goal: brief.goal || 'sales',
    tone: brief.tone || 'simple',
    platforms: brief.platforms || []
  };
}

export function validateBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push('productName');
  if (!brief.offerDescription) missing.push('offerDescription');
  if (!brief.audience) missing.push('audience');
  return {
    valid: missing.length === 0,
    missing
  };
}

export function buildCampaignFromBrief(brief, research = {}, copy = {}) {
  const now = new Date().toISOString();
  return {
    ...defaultCampaignState,
    id: `cmp_${Date.now()}`,
    status: 'draft',
    productName: brief.productName,
    productUrl: brief.productUrl,
    productImage: brief.productImage,
    offerDescription: brief.offerDescription,
    audience: brief.audience,
    goal: brief.goal,
    tone: brief.tone,
    platforms: brief.platforms || [],
    sections: {
      ...defaultCampaignState.sections,
      ...copy,
      research
    },
    createdAt: now,
    updatedAt: now
  };
}

export function getCampaignSummary(campaign) {
  return {
    id: campaign.id,
    name: campaign.productName || 'Untitled Offer',
    status: campaign.status,
    platforms: campaign.platforms || [],
    approvedCount: (campaign.approvedSections || []).length,
    updatedAt: campaign.updatedAt || null
  };
}