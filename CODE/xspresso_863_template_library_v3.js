export function createTemplateLibrary() {
  const templates = [];

  return {
    list() {
      return [...templates];
    },
    save(template) {
      const item = {
        id: template.id || `tpl_${Date.now()}`,
        name: template.name || 'Untitled Template',
        category: template.category || 'general',
        createdAt: template.createdAt || new Date().toISOString(),
        data: structuredClone(template.data || template),
      };
      templates.push(item);
      return item;
    },
    duplicate(id, overrides = {}) {
      const source = templates.find((tpl) => tpl.id === id);
      if (!source) return null;
      return this.save({
        ...source,
        id: undefined,
        name: overrides.name || `${source.name} Copy`,
        data: { ...source.data, ...overrides.data },
      });
    },
    remove(id) {
      const index = templates.findIndex((tpl) => tpl.id === id);
      if (index >= 0) templates.splice(index, 1);
      return index >= 0;
    },
    restore(id) {
      const source = templates.find((tpl) => tpl.id === id);
      return source ? structuredClone(source.data) : null;
    },
  };
}
