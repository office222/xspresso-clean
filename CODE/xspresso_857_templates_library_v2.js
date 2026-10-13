export function createTemplateFromCampaign(campaign) {
  return {
    id: `tpl_${Date.now()}`,
    name: `${campaign.name || 'Campaign'} Template`,
    sourceCampaignId: campaign.id || null,
    createdAt: new Date().toISOString(),
    data: {
      name: campaign.name || 'Untitled Campaign',
      brief: campaign.brief || {},
      draft: campaign.draft || {},
      platformVersions: campaign.platformVersions || {}
    }
  };
}

export function restoreTemplate(template, overrides = {}) {
  return {
    ...template.data,
    ...overrides,
    id: `cmp_${Date.now()}`,
    status: 'draft',
    restoredFromTemplateId: template.id,
    updatedAt: new Date().toISOString()
  };
}

export function duplicateCampaign(campaign, overrides = {}) {
  return {
    ...campaign,
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || `${campaign.name || 'Campaign'} Copy`,
    status: 'draft',
    duplicatedAt: new Date().toISOString()
  };
}

export function addTemplate(library, template) {
  return [template, ...(library || [])];
}
