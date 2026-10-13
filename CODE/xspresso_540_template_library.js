// Xspresso Template Library
// Save, restore, duplicate, and list campaign templates.

const templates = [];

export function createTemplate({ name, category = 'general', description = '', data = {} } = {}) {
  return {
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || 'Untitled Template',
    category,
    description,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveTemplate(template) {
  const item = createTemplate(template);
  templates.push(item);
  return item;
}

export function listTemplates() {
  return [...templates];
}

export function findTemplateById(id) {
  return templates.find(t => t.id === id) || null;
}

export function restoreTemplate(templateId, overrides = {}) {
  const template = findTemplateById(templateId);
  if (!template) return { success: false, message: 'Template not found.' };

  return {
    success: true,
    campaign: {
      ...template.data,
      ...overrides,
      id: `cmp_${Date.now()}`,
      name: overrides.name || template.name.replace(/\s+Template$/i, ''),
      status: 'draft',
      restoredFromTemplateId: template.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  };
}

export function duplicateTemplate(templateId, overrides = {}) {
  const template = findTemplateById(templateId);
  if (!template) return { success: false, message: 'Template not found.' };

  return saveTemplate({
    name: overrides.name || `${template.name} Copy`,
    category: overrides.category || template.category,
    description: overrides.description || template.description,
    data: { ...template.data, ...(overrides.data || {}) },
  });
}
