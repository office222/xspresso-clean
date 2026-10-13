// xspresso_695_review_panel_v11.js
// Review / approve / regenerate panel helpers

export function createReviewState(campaign = {}) {
  return {
    id: campaign.id || `cmp_${Date.now()}`,
    headline: campaign.headline || '',
    subheadline: campaign.subheadline || '',
    hooks: campaign.hooks || [],
    ads: campaign.ads || [],
    landingPage: campaign.landingPage || {},
    shoppingCart: campaign.shoppingCart || {},
    leadMagnet: campaign.leadMagnet || {},
    followUpEmails: campaign.followUpEmails || [],
    platformVersions: campaign.platformVersions || {},
    approvedSections: campaign.approvedSections || [],
    status: campaign.status || 'draft'
  };
}

export function approveSection(reviewState, sectionName) {
  const approved = new Set(reviewState.approvedSections || []);
  approved.add(sectionName);
  return { ...reviewState, approvedSections: [...approved] };
}

export function unapproveSection(reviewState, sectionName) {
  return {
    ...reviewState,
    approvedSections: (reviewState.approvedSections || []).filter(s => s !== sectionName)
  };
}

export function updateSection(reviewState, sectionName, value) {
  return {
    ...reviewState,
    [sectionName]: value,
    status: 'draft',
    updatedAt: new Date().toISOString()
  };
}

export function regenerateSection(reviewState, sectionName, context = '') {
  const regeneratedValue = `Regenerated ${sectionName}${context ? ` (${context})` : ''}`;
  return {
    ...reviewState,
    [sectionName]: regeneratedValue,
    status: 'draft',
    lastRegeneratedSection: sectionName,
    updatedAt: new Date().toISOString()
  };
}

export function summarizeReview(reviewState) {
  return {
    approvedCount: (reviewState.approvedSections || []).length,
    hookCount: (reviewState.hooks || []).length,
    adCount: (reviewState.ads || []).length,
    emailCount: (reviewState.followUpEmails || []).length,
    platformCount: Object.keys(reviewState.platformVersions || {}).length
  };
}
