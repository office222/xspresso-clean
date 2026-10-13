// xspresso_618_template_library_v6.js
// Template save / restore / duplicate helpers

export function createTemplateFromCampaign(campaign = {}) {
  return {
    id: `tpl_${Date.now()}`,
    name: `${campaign.name || 'Untitled Campaign'} Template`,
    category: campaign.category || 'general',
    description: campaign.description || 'Saved from a user campaign.',
    createdAt: new Date().toISOString(),
    data: { ...campaign, id: undefined, status: 'draft' },
  };
}

export function restoreCampaignFromTemplate(template = {}, overrides = {}) {
  return {
    ...(template.data || {}),
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || template.name?.replace(' Template', '') || 'Restored Campaign',
    status: 'draft',
    restoredAt: new Date().toISOString(),
  };
}

export function duplicateCampaign(campaign = {}, overrides = {}) {
  return {
    ...campaign,
    ...overrides,
    id: `dup_${Date.now()}`,
    name: overrides.name || `${campaign.name || 'Untitled Campaign'} Copy`,
    duplicatedAt: new Date().toISOString(),
  };
}

export function listTemplates(templates = []) {
  return templates.map(t => ({ id: t.id, name: t.name, category: t.category, updatedAt: t.updatedAt || t.createdAt }));
}
