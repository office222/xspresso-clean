export function getReviewSections(campaign = {}) {
  return [
    { key: "headline", label: "Headline", value: campaign.headline || "" },
    { key: "subheadline", label: "Subheadline", value: campaign.subheadline || "" },
    { key: "hooks", label: "Hooks", value: campaign.hooks || [] },
    { key: "ads", label: "Ad Copy", value: campaign.ads || [] },
    { key: "landingPage", label: "Landing Page", value: campaign.landingPage || {} },
    { key: "followUpEmails", label: "Follow-Up Emails", value: campaign.followUpEmails || [] }
  ];
}

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionName);
  return { ...campaign, approvedSections: Array.from(approved) };
}

export function regenerateSection(campaign, sectionName, regeneratedValue) {
  return {
    ...campaign,
    [sectionName]: regeneratedValue,
    lastRegeneratedSection: sectionName,
    updatedAt: new Date().toISOString()
  };
}
