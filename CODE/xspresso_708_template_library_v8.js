// Xspresso Template Library v8
// Save, restore, duplicate, and list templates built from the user's own campaigns.

export function saveTemplate(campaign = {}, name = '') {
  return {
    id: `tpl_${Date.now()}`,
    name: name || `${campaign.name || 'Untitled'} Template`,
    category: campaign.category || 'general',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: { ...campaign, id: undefined, status: 'template' }
  };
}

export function restoreTemplate(template = {}, overrides = {}) {
  return {
    ...template.data,
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || template.name.replace(' Template', ''),
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function duplicateTemplate(template = {}, overrides = {}) {
  return {
    ...template,
    id: `tpl_${Date.now()}_copy`,
    name: overrides.name || `${template.name || 'Untitled'} Copy`,
    updatedAt: new Date().toISOString()
  };
}

export function listTemplates(templates = []) {
  return templates
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

export function templateSummary(template = {}) {
  return {
    id: template.id,
    name: template.name,
    category: template.category,
    updatedAt: template.updatedAt || template.createdAt || null
  };
}
