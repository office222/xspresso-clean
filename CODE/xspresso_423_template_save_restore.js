/* xspresso_423_template_save_restore.js
   Template save/restore helpers.
*/

export function saveCampaignAsTemplate(campaign, templateName = '') {
  return {
    id: `tpl_${Date.now()}`,
    name: templateName || `${campaign?.name || 'Untitled Campaign'} Template`,
    category: campaign?.category || 'general',
    sourceCampaignId: campaign?.id || null,
    createdAt: new Date().toISOString(),
    data: { ...(campaign || {}) }
  };
}

export function restoreCampaignFromTemplate(template, overrides = {}) {
  const base = template?.data || {};
  return {
    ...base,
    ...overrides,
    id: `cmp_${Date.now()}`,
    status: 'draft',
    restoredFromTemplateId: template?.id || null,
    updatedAt: new Date().toISOString()
  };
}

export function listTemplateActions() {
  return ['save', 'restore', 'duplicate', 'archive'];
}

export function buildTemplateCard(template = {}) {
  return `
    <article style="background:#fff;border:1px solid #e6e6e6;border-radius:14px;padding:16px;">
      <div style="font-size:18px;font-weight:800;color:#111;">${template.name || 'Template'}</div>
      <div style="font-size:13px;color:#666;margin-top:4px;">${template.category || 'general'}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
        <button style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;">Restore</button>
        <button style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;">Duplicate</button>
      </div>
    </article>
  `;
}
