// xspresso_447_review_approve_regenerate_panel.js
// Campaign review / approve / regenerate helpers for Xspresso

export function buildReviewPanel(campaign = {}) {
  const sections = [
    "headline",
    "subheadline",
    "hooks",
    "ads",
    "landingPage",
    "shoppingCart",
    "leadMagnet",
    "followUpEmails",
    "platformVersions"
  ];

  return {
    campaignId: campaign.id || null,
    title: campaign.name || "Untitled Campaign",
    sections: sections.map((name) => ({
      name,
      approved: Boolean(campaign.approvedSections?.includes(name)),
      editable: true
    })),
    actions: ["approve", "edit", "regenerate", "simplify", "strengthen", "launch"]
  };
}

export function approveSection(campaign = {}, sectionName = "") {
  const approved = new Set(campaign.approvedSections || []);
  if (sectionName) approved.add(sectionName);
  return { ...campaign, approvedSections: [...approved] };
}

export function unapproveSection(campaign = {}, sectionName = "") {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter((section) => section !== sectionName)
  };
}

export function regenerateSection(campaign = {}, sectionName = "", tone = "simple") {
  const label = sectionName || "section";
  return {
    ...campaign,
    [sectionName]: `Regenerated ${label} content in a ${tone} tone.`,
    lastRegeneratedSection: sectionName,
    updatedAt: new Date().toISOString()
  };
}

export function buildSectionActions(sectionName = "") {
  return {
    sectionName,
    buttons: [
      "Approve",
      "Edit",
      "Regenerate",
      "Simplify",
      "Strengthen"
    ]
  };
}
