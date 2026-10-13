// xspresso_796_review_panel.js
// Review / approve / regenerate flow for Xspresso

export function createReviewState(campaign = {}) {
  return {
    id: campaign.id || `cmp_${Date.now()}`,
    headline: campaign.headline || '',
    subheadline: campaign.subheadline || '',
    hooks: campaign.hooks || [],
    ads: campaign.ads || [],
    landingPage: campaign.landingPage || {},
    followUpEmails: campaign.followUpEmails || [],
    approvedSections: campaign.approvedSections || [],
  };
}

export function approveSection(state, section) {
  const next = new Set(state.approvedSections || []);
  next.add(section);
  return { ...state, approvedSections: [...next] };
}

export function unapproveSection(state, section) {
  return { ...state, approvedSections: (state.approvedSections || []).filter(s => s !== section) };
}

export function regenerateSection(state, section, newValue) {
  return { ...state, [section]: newValue, updatedAt: new Date().toISOString() };
}

export function reviewSummary(state) {
  const totalSections = ['headline', 'subheadline', 'hooks', 'ads', 'landingPage', 'followUpEmails'].length;
  return {
    approvedCount: (state.approvedSections || []).length,
    totalSections,
    readyToLaunch: (state.approvedSections || []).length >= Math.ceil(totalSections * 0.6),
  };
}

export function reviewCopy(summary) {
  if (summary.readyToLaunch) {
    return { headline: 'Ready to launch', body: 'Review one last time, then launch.', cta: 'Launch Now' };
  }
  return { headline: 'Approve what you like', body: 'Tweak what you want. Regenerate what does not fit.', cta: 'Continue Editing' };
}
