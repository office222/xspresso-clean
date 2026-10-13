// xspresso_794_template_library.js
// Template library helpers for Xspresso

export const templates = [
  { id: 'tpl_launch', name: 'Launch Campaign', category: 'launch' },
  { id: 'tpl_leadmagnet', name: 'Lead Magnet', category: 'lead-magnet' },
  { id: 'tpl_followup', name: 'Follow-Up Sequence', category: 'follow-up' },
  { id: 'tpl_salespage', name: 'Sales Page', category: 'sales-page' },
  { id: 'tpl_adset', name: 'Ad Set', category: 'ad-campaign' },
];

export function saveTemplate(library, campaign) {
  const next = {
    id: `tpl_${Date.now()}`,
    name: `${campaign?.name || 'Untitled'} Template`,
    category: campaign?.category || 'general',
    data: { ...campaign, id: undefined },
    updatedAt: new Date().toISOString(),
  };
  return [...(library || []), next];
}

export function restoreTemplate(template, overrides = {}) {
  return {
    ...(template?.data || {}),
    ...overrides,
    id: `cmp_${Date.now()}`,
    status: 'draft',
    restoredFrom: template?.id || null,
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateCampaign(campaign, overrides = {}) {
  return {
    ...campaign,
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || `${campaign?.name || 'Untitled'} Copy`,
    status: 'draft',
    duplicatedFrom: campaign?.id || null,
    updatedAt: new Date().toISOString(),
  };
}

export function searchTemplates(library = [], query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return library;
  return library.filter(t => `${t.name} ${t.category}`.toLowerCase().includes(q));
}
