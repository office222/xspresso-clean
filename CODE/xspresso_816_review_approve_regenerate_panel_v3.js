// xspresso_816_review_approve_regenerate_panel_v3.js
// Review / approve / regenerate flow for Xspresso.

export function makeReviewSections(draft = {}) {
  return [
    { key: 'headline', label: 'Headline', value: draft.headline || '' },
    { key: 'subheadline', label: 'Subheadline', value: draft.subheadline || '' },
    { key: 'hooks', label: 'Hooks', value: draft.hooks || [] },
    { key: 'ads', label: 'Ads', value: draft.ads || [] },
    { key: 'landingPage', label: 'Landing Page', value: draft.landingPage || {} },
    { key: 'followUpEmails', label: 'Follow-up Emails', value: draft.followUpEmails || [] }
  ];
}

export function approveSection(state, sectionKey) {
  const approved = new Set(state.approvedSections || []);
  approved.add(sectionKey);
  return { ...state, approvedSections: Array.from(approved) };
}

export function regenerateSection(state, sectionKey, newValue) {
  return {
    ...state,
    [sectionKey]: newValue,
    approvedSections: (state.approvedSections || []).filter(key => key !== sectionKey),
    updatedAt: new Date().toISOString()
  };
}
