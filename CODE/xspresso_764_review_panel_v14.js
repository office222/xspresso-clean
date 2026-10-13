// xspresso_764_review_panel_v14.js
// Review, approve, edit, regenerate helpers

export function buildReviewState(campaign = {}) {
  return {
    campaignId: campaign.id || 'draft_campaign',
    approvedSections: [],
    draftReady: false,
    sections: {
      headline: campaign.headline || '',
      subheadline: campaign.subheadline || '',
      hooks: campaign.hooks || [],
      ads: campaign.ads || [],
      landingPage: campaign.landingPage || {},
      followUpEmails: campaign.followUpEmails || [],
    },
  };
}

export function approveSection(reviewState, sectionName) {
  const approved = new Set(reviewState.approvedSections || []);
  approved.add(sectionName);
  return { ...reviewState, approvedSections: [...approved] };
}

export function regenerateSection(reviewState, sectionName, replacement) {
  return {
    ...reviewState,
    sections: {
      ...reviewState.sections,
      [sectionName]: replacement,
    },
    draftReady: false,
  };
}

export function markDraftReady(reviewState) {
  return {
    ...reviewState,
    draftReady: true,
  };
}
