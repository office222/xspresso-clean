// xspresso_622_review_panel_v6.js

export const reviewActions = {
  APPROVE: "approve",
  EDIT: "edit",
  REGENERATE: "regenerate",
  SIMPLIFY: "simplify",
  STRENGTHEN: "strengthen",
};

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionName);
  return { ...campaign, approvedSections: Array.from(approved) };
}

export function regenerateSection(campaign, sectionName, value = `Regenerated ${sectionName}`) {
  return {
    ...campaign,
    [sectionName]: value,
    lastRegeneratedSection: sectionName,
    updatedAt: new Date().toISOString(),
  };
}

export function updateSection(campaign, sectionName, newValue) {
  return {
    ...campaign,
    [sectionName]: newValue,
    updatedAt: new Date().toISOString(),
  };
}
