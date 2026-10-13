export function buildReviewSections(campaign = {}) {
  return [
    { key: 'headline', label: 'Headline', value: campaign.headline || '', approved: false },
    { key: 'subheadline', label: 'Subheadline', value: campaign.subheadline || '', approved: false },
    { key: 'hooks', label: 'Hooks', value: campaign.hooks || [], approved: false },
    { key: 'ads', label: 'Ad Copy', value: campaign.ads || [], approved: false },
    { key: 'landingPage', label: 'Landing Page', value: campaign.landingPage || {}, approved: false },
    { key: 'followUpEmails', label: 'Follow-Up Emails', value: campaign.followUpEmails || [], approved: false }
  ];
}

export function approveSection(campaign, sectionKey) {
  const approvedSections = new Set(campaign.approvedSections || []);
  approvedSections.add(sectionKey);
  return { ...campaign, approvedSections: [...approvedSections] };
}

export function regenerateSection(campaign, sectionKey, replacementValue) {
  return {
    ...campaign,
    [sectionKey]: replacementValue,
    lastRegeneratedSection: sectionKey,
    updatedAt: new Date().toISOString()
  };
}
