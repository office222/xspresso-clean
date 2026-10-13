// xspresso_527_campaign_editor.js
// Campaign editing helpers for Xspresso V1

export function updateSection(campaign, sectionName, newValue) {
  return {
    ...campaign,
    [sectionName]: newValue,
    updatedAt: new Date().toISOString(),
  };
}

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionName);
  return {
    ...campaign,
    approvedSections: Array.from(approved),
  };
}

export function unapproveSection(campaign, sectionName) {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter((s) => s !== sectionName),
  };
}

export function regenerateSection(campaign, sectionName) {
  return {
    ...campaign,
    [sectionName]: `Regenerated ${sectionName}`,
    lastRegeneratedSection: sectionName,
    updatedAt: new Date().toISOString(),
  };
}

export function regenerateAll(campaign) {
  return {
    ...campaign,
    approvedSections: [],
    lastRegeneratedSection: "all",
    updatedAt: new Date().toISOString(),
  };
}
