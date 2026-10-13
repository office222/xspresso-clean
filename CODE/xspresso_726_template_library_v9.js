export const templateLibrary = [
  {
    id: 'tpl_launch',
    name: 'Product Launch',
    category: 'launch',
    description: 'A fast way to build a launch campaign from a simple brief.'
  },
  {
    id: 'tpl_lead',
    name: 'Lead Magnet',
    category: 'lead',
    description: 'Capture leads with a clean opt-in and follow-up path.'
  },
  {
    id: 'tpl_followup',
    name: 'Follow-Up Sequence',
    category: 'followup',
    description: 'Keep the conversation going automatically.'
  },
  {
    id: 'tpl_ads',
    name: 'Ad Campaign',
    category: 'ads',
    description: 'Create a set of ad variations and hooks quickly.'
  }
];

export function findTemplateById(id) {
  return templateLibrary.find((item) => item.id === id) || null;
}

export function saveCampaignAsTemplate(campaign) {
  return {
    id: `tpl_${Date.now()}`,
    name: `${campaign.name || 'Untitled'} Template`,
    category: campaign.category || 'general',
    description: 'Saved from a user campaign.',
    sourceCampaignId: campaign.id,
    createdAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(campaign)),
  };
}

export function restoreCampaignFromTemplate(template, overrides = {}) {
  return {
    ...(template.data || {}),
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || template.name.replace(/ Template$/, ''),
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateTemplate(template, overrides = {}) {
  return {
    ...template,
    id: `tpl_${Date.now()}`,
    name: overrides.name || `${template.name} Copy`,
    createdAt: new Date().toISOString(),
  };
}
