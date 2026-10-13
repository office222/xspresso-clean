// xspresso_875_review_panel.js
// Review / approve / regenerate helpers.

export function splitCampaignSections(campaign = {}) {
  return [
    { key: 'headline', label: 'Headline', value: campaign.headline || '' },
    { key: 'subheadline', label: 'Subheadline', value: campaign.subheadline || '' },
    { key: 'adCopy', label: 'Ad Copy', value: (campaign.adCopy || []).join('\n\n') },
    { key: 'landingPage', label: 'Landing Page', value: campaign.landingPage?.body || '' },
    { key: 'followUp', label: 'Follow-Up', value: (campaign.followUp || []).join('\n\n') },
  ];
}

export function approveSection(approvedSections = [], sectionKey) {
  const next = new Set(approvedSections);
  next.add(sectionKey);
  return [...next];
}

export function unapproveSection(approvedSections = [], sectionKey) {
  return approvedSections.filter((key) => key !== sectionKey);
}

export function regenerateSection(campaign = {}, sectionKey, newValue) {
  const next = { ...campaign, updatedAt: new Date().toISOString() };
  next[sectionKey] = newValue;
  return next;
}

export function buildReviewStatus(campaign = {}) {
  const sections = splitCampaignSections(campaign);
  return {
    ready: sections.every((s) => String(s.value || '').trim().length > 0),
    sectionCount: sections.length,
    approvedCount: (campaign.approvedSections || []).length,
  };
}
