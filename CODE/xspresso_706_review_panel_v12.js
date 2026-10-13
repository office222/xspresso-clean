// Xspresso Review Panel v12
// Handles approve / edit / regenerate interactions for a campaign draft.

export function buildReviewSections(campaign = {}) {
  return [
    { key: 'headline', label: 'Headline', value: campaign.headline || '', approved: false },
    { key: 'subheadline', label: 'Subheadline', value: campaign.subheadline || '', approved: false },
    { key: 'hooks', label: 'Hooks', value: campaign.hooks || [], approved: false },
    { key: 'ads', label: 'Ads', value: campaign.ads || [], approved: false },
    { key: 'landingPage', label: 'Landing Page', value: campaign.landingPage || {}, approved: false },
    { key: 'followUpEmails', label: 'Follow-up Emails', value: campaign.followUpEmails || [], approved: false }
  ];
}

export function approveSection(campaign, sectionKey) {
  return {
    ...campaign,
    approvedSections: Array.from(new Set([...(campaign.approvedSections || []), sectionKey]))
  };
}

export function unapproveSection(campaign, sectionKey) {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter(key => key !== sectionKey)
  };
}

export function updateSection(campaign, sectionKey, value) {
  return {
    ...campaign,
    [sectionKey]: value,
    updatedAt: new Date().toISOString()
  };
}

export function regenerateSection(campaign, sectionKey, generatedValue) {
  return {
    ...campaign,
    [sectionKey]: generatedValue,
    lastRegeneratedSection: sectionKey,
    updatedAt: new Date().toISOString()
  };
}

export function reviewSummary(campaign = {}) {
  return {
    title: campaign.headline || 'Untitled Campaign',
    approvedCount: (campaign.approvedSections || []).length,
    sectionCount: buildReviewSections(campaign).length,
    status: campaign.status || 'draft'
  };
}
