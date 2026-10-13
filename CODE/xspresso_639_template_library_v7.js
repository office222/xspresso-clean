// xspresso_639_template_library_v7.js
// Template and reuse helpers for Xspresso

export function saveAsTemplate(campaign = {}, name = '') {
  return {
    id: `tpl_${Date.now()}`,
    name: name || `${campaign.name || 'Untitled'} Template`,
    category: campaign.category || 'general',
    createdAt: new Date().toISOString(),
    data: { ...campaign, id: undefined }
  };
}

export function restoreFromTemplate(template = {}, overrides = {}) {
  return {
    ...(template.data || {}),
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || template.name?.replace(' Template', '') || 'Untitled Campaign',
    status: 'draft',
    restoredAt: new Date().toISOString()
  };
}

export function duplicateCampaign(campaign = {}, overrides = {}) {
  return {
    ...campaign,
    ...overrides,
    id: `dup_${Date.now()}`,
    name: overrides.name || `${campaign.name || 'Untitled Campaign'} Copy`,
    duplicatedAt: new Date().toISOString()
  };
}
