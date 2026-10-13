// xspresso_449_template_save_restore.js
// Template save / restore helpers for Xspresso

export function saveCampaignAsTemplate(campaign = {}, templateName = "") {
  return {
    id: `tpl_${Date.now()}`,
    name: templateName || `${campaign.name || "Untitled Campaign"} Template`,
    category: campaign.category || "general",
    description: "Saved from a user campaign.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: { ...campaign }
  };
}

export function restoreCampaignFromTemplate(template = {}, overrides = {}) {
  return {
    ...(template.data || {}),
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || (template.name || "Template").replace(/\s+Template$/, ""),
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function duplicateCampaign(campaign = {}, overrides = {}) {
  return {
    ...campaign,
    ...overrides,
    id: `dup_${Date.now()}`,
    name: overrides.name || `${campaign.name || "Untitled Campaign"} Copy`,
    status: "draft",
    updatedAt: new Date().toISOString()
  };
}

export function getStarterTemplates() {
  return [
    "Launch Campaign",
    "Lead Magnet Campaign",
    "Follow-Up Sequence",
    "Ad Campaign",
    "Landing Page",
    "Sales Funnel"
  ];
}
