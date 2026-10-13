// xspresso_450_campaign_editor.js
// Campaign editor helpers for Xspresso

export function buildCampaignEditor(campaign = {}) {
  return {
    id: campaign.id || null,
    name: campaign.name || "Untitled Campaign",
    status: campaign.status || "draft",
    editableSections: [
      "headline",
      "subheadline",
      "hooks",
      "ads",
      "landingPage",
      "shoppingCart",
      "leadMagnet",
      "followUpEmails",
      "platformVersions"
    ],
    actions: ["save", "approve", "regenerate", "launch", "export"]
  };
}

export function updateCampaignSection(campaign = {}, sectionName = "", newValue = null) {
  if (!sectionName) return campaign;
  return {
    ...campaign,
    [sectionName]: newValue,
    updatedAt: new Date().toISOString(),
    status: "draft"
  };
}

export function setCampaignApproved(campaign = {}) {
  return {
    ...campaign,
    status: "approved",
    approvedAt: new Date().toISOString()
  };
}

export function setCampaignNeedsReview(campaign = {}, reason = "") {
  return {
    ...campaign,
    status: "needs_review",
    reviewReason: reason || "Campaign needs attention",
    updatedAt: new Date().toISOString()
  };
}

export function buildCampaignEditorHints() {
  return [
    "Approve what you like.",
    "Tweak what you want.",
    "Regenerate what does not fit.",
    "You stay in command."
  ];
}
