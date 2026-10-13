// xspresso_492_review_panel_v3.js
// Review / approve / regenerate scaffolding.

export const reviewActions = {
  APPROVE: "approve",
  EDIT: "edit",
  REGENERATE: "regenerate",
  SIMPLIFY: "simplify",
  STRENGTHEN: "strengthen",
  SAVE: "save",
  LAUNCH: "launch"
};

export function createReviewState(campaign = {}) {
  return {
    id: campaign.id || `cmp_${Date.now()}`,
    headline: campaign.headline || "",
    subheadline: campaign.subheadline || "",
    hooks: campaign.hooks || [],
    ads: campaign.ads || [],
    landingPage: campaign.landingPage || {},
    shoppingCart: campaign.shoppingCart || {},
    leadMagnet: campaign.leadMagnet || {},
    followUpEmails: campaign.followUpEmails || [],
    platformVersions: campaign.platformVersions || {},
    approvedSections: campaign.approvedSections || []
  };
}

export function approveSection(state, sectionName) {
  const approved = new Set(state.approvedSections || []);
  approved.add(sectionName);
  return { ...state, approvedSections: Array.from(approved) };
}

export function unapproveSection(state, sectionName) {
  return {
    ...state,
    approvedSections: (state.approvedSections || []).filter(section => section !== sectionName)
  };
}

export function regenerateSection(state, sectionName, replacement = null) {
  const value = replacement || `Regenerated ${sectionName} content`;
  return {
    ...state,
    [sectionName]: value,
    lastRegeneratedSection: sectionName,
    updatedAt: new Date().toISOString()
  };
}