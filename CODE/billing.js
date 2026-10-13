// Xspresso - Campaign Orchestrator
// Purpose: glue together brief -> generate -> review -> launch -> monitor.

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || '',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platforms: Array.isArray(input.platforms) ? input.platforms : []
  };
}

export function normalizeCampaignDraft(draft = {}) {
  return {
    headline: draft.headline || '',
    subheadline: draft.subheadline || '',
    hooks: draft.hooks || [],
    ads: draft.ads || [],
    landingPage: draft.landingPage || {},
    shoppingCart: draft.shoppingCart || {},
    leadMagnet: draft.leadMagnet || {},
    followUpEmails: draft.followUpEmails || [],
    platformVersions: draft.platformVersions || {},
    approvedSections: draft.approvedSections || []
  };
}

export function assembleCampaign(input = {}, generated = {}) {
  const brief = buildCampaignBrief(input);
  const draft = normalizeCampaignDraft(generated);

  return {
    id: input.id || `cmp_${Date.now()}`,
    brief,
    draft,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function campaignCanLaunch(campaign) {
  const d = campaign?.draft || {};
  const missing = [];

  if (!d.headline) missing.push('headline');
  if (!d.landingPage) missing.push('landingPage');
  if (!Object.keys(d.platformVersions || {}).length) missing.push('platformVersions');

  return {
    ready: missing.length === 0,
    missing
  };
}
