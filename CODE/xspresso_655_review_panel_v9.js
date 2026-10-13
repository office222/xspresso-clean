// xspresso_655_review_panel_v9.js
// Review / approve / regenerate helpers

export const REVIEW_ACTIONS = {
  APPROVE: 'approve',
  EDIT: 'edit',
  REGENERATE: 'regenerate',
  SIMPLIFY: 'simplify',
  STRENGTHEN: 'strengthen'
};

export function splitCampaignSections(draft = {}) {
  return [
    { key: 'headline', label: 'Headline', value: draft.headline || '' },
    { key: 'subheadline', label: 'Subheadline', value: draft.subheadline || '' },
    { key: 'hooks', label: 'Hooks', value: draft.hooks || [] },
    { key: 'ads', label: 'Ad Copy', value: draft.ads || [] },
    { key: 'landingPage', label: 'Landing Page', value: draft.landingPage || {} },
    { key: 'followUp', label: 'Follow-Up', value: draft.followUp || [] }
  ];
}

export function approveSection(state, sectionKey) {
  const approved = new Set(state.approvedSections || []);
  approved.add(sectionKey);
  return { ...state, approvedSections: [...approved] };
}

export function unapproveSection(state, sectionKey) {
  return {
    ...state,
    approvedSections: (state.approvedSections || []).filter(k => k !== sectionKey)
  };
}

export function regenerateSection(draft, sectionKey, replacement) {
  return {
    ...draft,
    [sectionKey]: replacement,
    lastRegeneratedSection: sectionKey,
    updatedAt: new Date().toISOString()
  };
}

export function reviewSummary(state) {
  return {
    approvedCount: (state.approvedSections || []).length,
    remainingCount: Math.max((state.totalSections || 0) - (state.approvedSections || []).length, 0),
    readyToLaunch: Boolean(state.readyToLaunch)
  };
}
