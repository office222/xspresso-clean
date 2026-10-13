// xspresso_437_template_library.js
// Xspresso template library: save, restore, and reuse your own work.

export function createTemplate({ name, category = 'general', description = '', data = {} }) {
  return {
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    category,
    description,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveCampaignAsTemplate(campaign = {}, templateName) {
  return createTemplate({
    name: templateName || `${campaign.name || 'Untitled Campaign'} Template`,
    category: campaign.category || 'campaign',
    description: 'Saved from a user campaign.',
    data: { ...campaign, id: undefined, status: 'draft' },
  });
}

export function restoreTemplate(template = {}, overrides = {}) {
  return {
    ...(template.data || {}),
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || (template.name || 'Untitled Template').replace(/\s*Template$/i, ''),
    status: 'draft',
    restoredFromTemplateId: template.id || null,
    updatedAt: new Date().toISOString(),
  };
}

export function listTemplates(templates = []) {
  return templates.map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    updatedAt: template.updatedAt,
  }));
}