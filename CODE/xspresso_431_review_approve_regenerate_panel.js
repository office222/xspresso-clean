// xspresso_431_review_approve_regenerate_panel.js
// Review / approve / regenerate helpers for Xspresso

export function initCampaignDraft(draft = {}) {
  return {
    id: draft.id || `cmp_${Date.now()}`,
    status: draft.status || "draft",
    headline: draft.headline || "",
    subheadline: draft.subheadline || "",
    hooks: draft.hooks || [],
    ads: draft.ads || [],
    landingPage: draft.landingPage || {},
    shoppingCart: draft.shoppingCart || {},
    leadMagnet: draft.leadMagnet || {},
    followUpEmails: draft.followUpEmails || [],
    platformVersions: draft.platformVersions || {},
    approvedSections: draft.approvedSections || [],
  };
}

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionName);
  return { ...campaign, approvedSections: Array.from(approved) };
}

export function unapproveSection(campaign, sectionName) {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter((section) => section !== sectionName),
  };
}

export function updateSection(campaign, sectionName, newValue) {
  return {
    ...campaign,
    [sectionName]: newValue,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}

export function regenerateSection(campaign, sectionName, replacementValue = null) {
  const fallback = `Regenerated ${sectionName} content`;
  return {
    ...campaign,
    [sectionName]: replacementValue || fallback,
    lastRegeneratedSection: sectionName,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}

export function approveAndLaunchReady(campaign) {
  return {
    ...campaign,
    status: "ready_to_launch",
    launchReady: true,
    launchPrompt: "Ready to go live.",
  };
}
