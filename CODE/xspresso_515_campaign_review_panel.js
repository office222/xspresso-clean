export function buildReviewSections(campaign = {}) {
  return [
    { key: 'headline', label: 'Headline', value: campaign.headline || '' },
    { key: 'subheadline', label: 'Subheadline', value: campaign.subheadline || '' },
    { key: 'hooks', label: 'Hooks', value: campaign.hooks || [] },
    { key: 'ads', label: 'Ad Copy', value: campaign.ads || [] },
    { key: 'landingPage', label: 'Landing Page Copy', value: campaign.landingPage || {} },
    { key: 'shoppingCart', label: 'Shopping Cart Copy', value: campaign.shoppingCart || {} },
    { key: 'leadMagnet', label: 'Lead Magnet Copy', value: campaign.leadMagnet || {} },
    { key: 'followUpEmails', label: 'Follow-up Emails', value: campaign.followUpEmails || [] },
    { key: 'platformVersions', label: 'Platform Versions', value: campaign.platformVersions || {} }
  ];
}

export function approveSection(campaign, sectionKey) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionKey);
  return { ...campaign, approvedSections: Array.from(approved) };
}

export function unapproveSection(campaign, sectionKey) {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter(k => k !== sectionKey)
  };
}

export function regenerateSection(campaign, sectionKey, newValue) {
  return {
    ...campaign,
    [sectionKey]: newValue,
    updatedAt: new Date().toISOString(),
    approvedSections: (campaign.approvedSections || []).filter(k => k !== sectionKey)
  };
}

export function canLaunchCampaign(campaign) {
  const required = ['headline', 'landingPage'];
  const missing = required.filter(key => !campaign[key] || (typeof campaign[key] === 'object' && Object.keys(campaign[key]).length === 0));
  return { ready: missing.length === 0, missing };
}
