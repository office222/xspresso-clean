// xspresso_679_template_library.js
// Template save, restore, and duplicate helpers.

export function saveTemplate(campaign) {
  return {
    id: `tpl_${Date.now()}`,
    name: `${campaign.name || 'Untitled'} Template`,
    sourceCampaignId: campaign.id,
    createdAt: new Date().toISOString(),
    data: { ...campaign },
  };
}

export function restoreTemplate(template, overrides = {}) {
  return {
    ...template.data,
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || template.name.replace(' Template', ''),
    status: 'draft',
    restoredFromTemplateId: template.id,
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateTemplate(template) {
  return {
    ...template,
    id: `tpl_${Date.now()}_copy`,
    name: `${template.name} Copy`,
    createdAt: new Date().toISOString(),
  };
}

export function listTemplates(templates = []) {
  return templates.map((template) => ({
    id: template.id,
    name: template.name,
    createdAt: template.createdAt,
  }));
}
