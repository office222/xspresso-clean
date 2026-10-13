// xspresso_818_template_library_v3.js
// Template save / restore / duplicate helpers for Xspresso.

export function saveTemplate(campaign = {}) {
  return {
    id: `tpl_${Date.now()}`,
    name: `${campaign.name || 'Untitled'} Template`,
    data: { ...campaign },
    createdAt: new Date().toISOString()
  };
}

export function duplicateCampaign(campaign = {}) {
  return {
    ...campaign,
    id: `cmp_${Date.now()}`,
    name: `${campaign.name || 'Untitled'} Copy`,
    status: 'draft',
    duplicatedAt: new Date().toISOString()
  };
}

export function restoreFromTemplate(template = {}) {
  return {
    ...(template.data || {}),
    id: `cmp_${Date.now()}`,
    status: 'draft',
    restoredAt: new Date().toISOString()
  };
}
