// xspresso_635_campaign_review_panel_v8.js
// Review / approve / regenerate helpers for Xspresso

export function getReviewSections(campaign = {}) {
  return {
    headline: campaign.headline || '',
    subheadline: campaign.subheadline || '',
    hooks: campaign.hooks || [],
    ads: campaign.ads || [],
    landingPage: campaign.landingPage || {},
    shoppingCart: campaign.shoppingCart || {},
    leadMagnet: campaign.leadMagnet || {},
    followUpEmails: campaign.followUpEmails || [],
    platformVersions: campaign.platformVersions || {}
  };
}

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionName);
  return { ...campaign, approvedSections: [...approved] };
}

export function regenerateSection(campaign, sectionName, value) {
  return {
    ...campaign,
    [sectionName]: value,
    updatedAt: new Date().toISOString(),
    lastRegeneratedSection: sectionName
  };
}
