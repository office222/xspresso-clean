// xspresso_688_campaign_review_panel_v10.js
// Review / approve / regenerate helpers for Xspresso.

export const EDITABLE_SECTIONS = [
  "headline",
  "subheadline",
  "hooks",
  "adCopy",
  "landingPage",
  "shoppingCart",
  "leadMagnet",
  "followUpEmails",
  "platformVersions"
];

export function createDraftState(initial = {}) {
  return {
    id: initial.id || `cmp_${Date.now()}`,
    status: initial.status || "draft",
    headline: initial.headline || "",
    subheadline: initial.subheadline || "",
    hooks: initial.hooks || [],
    adCopy: initial.adCopy || [],
    landingPage: initial.landingPage || {},
    shoppingCart: initial.shoppingCart || {},
    leadMagnet: initial.leadMagnet || {},
    followUpEmails: initial.followUpEmails || [],
    platformVersions: initial.platformVersions || {},
    approvedSections: initial.approvedSections || []
  };
}

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionName);
  return { ...campaign, approvedSections: [...approved] };
}

export function unapproveSection(campaign, sectionName) {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter((s) => s !== sectionName)
  };
}

export function updateSection(campaign, sectionName, newValue) {
  if (!EDITABLE_SECTIONS.includes(sectionName)) return campaign;
  return {
    ...campaign,
    [sectionName]: newValue,
    status: "draft",
    updatedAt: new Date().toISOString()
  };
}

export function regenerateSection(campaign, sectionName, variant = "default") {
  const value = `Regenerated ${sectionName} (${variant})`;
  return updateSection(campaign, sectionName, sectionName === "hooks" ? [value] : value);
}

export function regenerateAll(campaign) {
  return {
    ...campaign,
    headline: "Wake up your marketing.",
    subheadline: "More responses. Less software chaos.",
    hooks: [],
    adCopy: [],
    landingPage: {},
    shoppingCart: {},
    leadMagnet: {},
    followUpEmails: [],
    platformVersions: {},
    approvedSections: [],
    status: "draft",
    updatedAt: new Date().toISOString()
  };
}

export function buildReviewSummary(campaign) {
  return {
    title: campaign.headline || "Untitled Campaign",
    subtitle: campaign.subheadline || "",
    hookCount: campaign.hooks?.length || 0,
    adCount: campaign.adCopy?.length || 0,
    emailCount: campaign.followUpEmails?.length || 0,
    platforms: Object.keys(campaign.platformVersions || {})
  };
}
