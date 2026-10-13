export function createTemplateFromCampaign(campaign, overrides = {}) {
  const id = overrides.id || `tpl_${Date.now()}`;
  return {
    id,
    name: overrides.name || `${campaign?.name || 'Untitled Campaign'} Template`,
    category: overrides.category || campaign?.category || 'general',
    createdAt: new Date().toISOString(),
    sourceCampaignId: campaign?.id || null,
    data: structuredClone(campaign || {}),
  };
}

export function duplicateTemplate(template, overrides = {}) {
  const copy = structuredClone(template || {});
  return {
    ...copy,
    id: overrides.id || `tpl_${Date.now()}_copy`,
    name: overrides.name || `${copy.name || 'Template'} Copy`,
    createdAt: new Date().toISOString(),
    sourceTemplateId: copy.id || null,
  };
}

export function restoreCampaignFromTemplate(template, overrides = {}) {
  const source = template?.data || {};
  return {
    ...structuredClone(source),
    ...overrides,
    id: overrides.id || `cmp_${Date.now()}`,
    status: 'draft',
    restoredFromTemplateId: template?.id || null,
    restoredAt: new Date().toISOString(),
  };
}

export function listTemplateSummaries(templates = []) {
  return templates.map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category || 'general',
    updatedAt: template.updatedAt || template.createdAt || null,
    sourceCampaignId: template.sourceCampaignId || null,
  }));
}

export function searchTemplates(templates = [], query = '') {
  const needle = query.trim().toLowerCase();
  if (!needle) return listTemplateSummaries(templates);
  return listTemplateSummaries(templates).filter((item) => {
    return [item.name, item.category, item.id]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
}
