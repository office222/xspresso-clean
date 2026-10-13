// xspresso_782_template_library.js
// Save, restore, and duplicate campaign templates

export function saveTemplate(campaign, name = `${campaign.name || "Campaign"} Template`) {
  return {
    id: `tpl_${Date.now()}`,
    name,
    sourceCampaignId: campaign.id,
    createdAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(campaign))
  };
}

export function restoreTemplate(template, overrides = {}) {
  return {
    ...JSON.parse(JSON.stringify(template.data || {})),
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || template.name.replace(/\s+Template$/i, ""),
    status: "draft",
    restoredFromTemplateId: template.id,
    updatedAt: new Date().toISOString()
  };
}

export function duplicateCampaign(campaign, overrides = {}) {
  return {
    ...JSON.parse(JSON.stringify(campaign)),
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || `${campaign.name || "Campaign"} Copy`,
    status: "draft",
    duplicatedFromId: campaign.id,
    updatedAt: new Date().toISOString()
  };
}

export function listTemplates(templates = []) {
  return templates.map(t => ({ id: t.id, name: t.name, createdAt: t.createdAt }));
}
