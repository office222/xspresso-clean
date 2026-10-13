// xspresso_758_template_library.js
// Template save / restore / duplicate helpers

export function saveTemplate(campaign) {
  return {
    id: `tpl_${Date.now()}`,
    name: `${campaign.name || 'Untitled'} Template`,
    sourceCampaignId: campaign.id,
    createdAt: new Date().toISOString(),
    data: { ...campaign }
  };
}

export function restoreTemplate(template, overrides = {}) {
  return {
    ...template.data,
    ...overrides,
    id: `cmp_${Date.now()}`,
    status: 'draft',
    createdAt: new Date().toISOString()
  };
}

export function duplicateCampaign(campaign, overrides = {}) {
  return {
    ...campaign,
    ...overrides,
    id: `dup_${Date.now()}`,
    name: overrides.name || `${campaign.name || 'Untitled'} Copy`
  };
}

export function renderTemplateList(templates = []) {
  return `
    <div class="template-library">
      ${templates.map(t => `
        <div class="template-card" data-template-id="${t.id}">
          <h3>${escapeHtml(t.name || 'Template')}</h3>
          <p>${escapeHtml(t.description || 'Saved campaign template')}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
