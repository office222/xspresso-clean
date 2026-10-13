// Xspresso template library v4
export function createTemplate({ id, name, category = 'general', description = '', data = {} }) {
  return { id, name, category, description, data, createdAt: new Date().toISOString() };
}

export function saveTemplate(library, template) {
  return [template, ...(library || [])];
}

export function restoreTemplate(template, overrides = {}) {
  return {
    ...template.data,
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || template.name,
    status: 'draft',
    restoredFromTemplateId: template.id,
    updatedAt: new Date().toISOString()
  };
}

export function duplicateTemplate(template) {
  return { ...template, id: `tpl_${Date.now()}`, name: `${template.name} Copy` };
}
