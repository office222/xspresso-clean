// xspresso_590_campaign_review_panel.js
// Review / approve / regenerate panel helpers.

export function buildReviewSections(campaign = {}) {
  return [
    { key: 'headline', label: 'Headline', value: campaign.headline || '' },
    { key: 'subheadline', label: 'Subheadline', value: campaign.subheadline || '' },
    { key: 'hooks', label: 'Hooks', value: campaign.hooks || [] },
    { key: 'ads', label: 'Ads', value: campaign.ads || [] },
    { key: 'landingPage', label: 'Landing Page', value: campaign.landingPage || {} },
    { key: 'followUpEmails', label: 'Follow-up Emails', value: campaign.followUpEmails || [] }
  ];
}

export function approveSection(campaign, sectionKey) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionKey);
  return { ...campaign, approvedSections: [...approved] };
}

export function regenerateSection(campaign, sectionKey, replacement) {
  return {
    ...campaign,
    [sectionKey]: replacement,
    lastRegeneratedSection: sectionKey,
    updatedAt: new Date().toISOString()
  };
}

export function reviewHint() {
  return 'Approve what you like. Tweak what you want. Regenerate what does not fit.';
}