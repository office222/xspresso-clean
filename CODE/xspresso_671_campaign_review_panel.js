// xspresso_671_campaign_review_panel.js
// Review / approve / regenerate helpers for campaign assets.

export const REVIEW_ACTIONS = {
  APPROVE: 'approve',
  EDIT: 'edit',
  REGENERATE: 'regenerate',
  SIMPLIFY: 'simplify',
  STRENGTHEN: 'strengthen'
};

export function buildReviewState(campaign = {}) {
  return {
    id: campaign.id || null,
    approvedSections: campaign.approvedSections || [],
    editableSections: [
      'headline', 'subheadline', 'hooks', 'ads', 'landingPage',
      'shoppingCart', 'leadMagnet', 'followUpEmails', 'platformVersions'
    ]
  };
}

export function approveSection(state, sectionName) {
  const approvedSections = new Set(state.approvedSections || []);
  approvedSections.add(sectionName);
  return { ...state, approvedSections: Array.from(approvedSections) };
}

export function regenerateSection(campaign, sectionName, replacementText = '') {
  return {
    ...campaign,
    [sectionName]: replacementText || `Regenerated ${sectionName}`,
    lastRegeneratedSection: sectionName,
    updatedAt: new Date().toISOString()
  };
}
