// xspresso_495_templates_library_v3.js
// Template and campaign library helpers.

export function saveAsTemplate(campaign = {}, templateName = "") {
  return {
    id: `tpl_${Date.now()}`,
    name: templateName || `${campaign.name || "Untitled"} Template`,
    category: campaign.category || "general",
    description: "Saved from a user campaign.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: { ...campaign }
  };
}

export function createCampaignFromTemplate(template = {}, overrides = {}) {
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
    duplicatedAt: new Date().toISOString()
  };
}