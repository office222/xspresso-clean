// Xspresso - Review / Approve / Regenerate Panel (v2)
// Purpose: Let users review campaign sections, approve what they like,
// edit what they want, and regenerate sections independently.

export function createReviewState(campaign = {}) {
  return {
    campaignId: campaign.id || null,
    sections: {
      headline: { value: campaign.headline || '', approved: false },
      subheadline: { value: campaign.subheadline || '', approved: false },
      hooks: { value: campaign.hooks || [], approved: false },
      ads: { value: campaign.ads || [], approved: false },
      landingPage: { value: campaign.landingPage || {}, approved: false },
      shoppingCart: { value: campaign.shoppingCart || {}, approved: false },
      leadMagnet: { value: campaign.leadMagnet || {}, approved: false },
      followUpEmails: { value: campaign.followUpEmails || [], approved: false },
      platformVersions: { value: campaign.platformVersions || {}, approved: false },
    },
    status: campaign.status || 'draft',
    lastUpdated: new Date().toISOString(),
  };
}

export function approveSection(reviewState, sectionName) {
  const section = reviewState.sections?.[sectionName];
  if (!section) return reviewState;
  return {
    ...reviewState,
    sections: {
      ...reviewState.sections,
      [sectionName]: { ...section, approved: true },
    },
    lastUpdated: new Date().toISOString(),
  };
}

export function unapproveSection(reviewState, sectionName) {
  const section = reviewState.sections?.[sectionName];
  if (!section) return reviewState;
  return {
    ...reviewState,
    sections: {
      ...reviewState.sections,
      [sectionName]: { ...section, approved: false },
    },
    lastUpdated: new Date().toISOString(),
  };
}

export function updateSection(reviewState, sectionName, value) {
  const section = reviewState.sections?.[sectionName];
  if (!section) return reviewState;
  return {
    ...reviewState,
    sections: {
      ...reviewState.sections,
      [sectionName]: { ...section, value, approved: false },
    },
    lastUpdated: new Date().toISOString(),
  };
}

export function regenerateSection(reviewState, sectionName, generator = () => '') {
  const section = reviewState.sections?.[sectionName];
  if (!section) return reviewState;
  const newValue = generator(section.value, reviewState);
  return {
    ...reviewState,
    sections: {
      ...reviewState.sections,
      [sectionName]: { ...section, value: newValue, approved: false },
    },
    lastUpdated: new Date().toISOString(),
  };
}

export function isReadyToLaunch(reviewState) {
  const sections = reviewState.sections || {};
  const required = ['headline', 'subheadline', 'ads', 'landingPage'];
  return required.every((key) => {
    const section = sections[key];
    if (!section) return false;
    if (Array.isArray(section.value)) return section.value.length > 0;
    if (typeof section.value === 'object') return Object.keys(section.value || {}).length > 0;
    return String(section.value || '').trim().length > 0;
  });
}

export function reviewSummary(reviewState) {
  const sections = reviewState.sections || {};
  return {
    campaignId: reviewState.campaignId,
    approvedCount: Object.values(sections).filter((s) => s.approved).length,
    totalSections: Object.keys(sections).length,
    readyToLaunch: isReadyToLaunch(reviewState),
    lastUpdated: reviewState.lastUpdated,
  };
}
