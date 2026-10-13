// xspresso_507_campaign_actions.js
// Campaign actions used across builder, review, launch, and monitoring.

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionName);
  return { ...campaign, approvedSections: Array.from(approved), updatedAt: new Date().toISOString() };
}

export function unapproveSection(campaign, sectionName) {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter(section => section !== sectionName),
    updatedAt: new Date().toISOString()
  };
}

export function regenerateSection(campaign, sectionName, content) {
  return {
    ...campaign,
    [sectionName]: content,
    lastRegeneratedSection: sectionName,
    updatedAt: new Date().toISOString()
  };
}

export function duplicateCampaign(campaign) {
  return {
    ...campaign,
    id: `cmp_${Date.now()}`,
    name: `${campaign.name || 'Untitled Campaign'} Copy`,
    status: 'draft',
    approvedSections: [],
    duplicatedFrom: campaign.id,
    createdAt: new Date().toISOString()
  };
}

export function buildActionMenu() {
  return [
    'approve',
    'edit',
    'regenerate',
    'duplicate',
    'save',
    'launch',
    'export'
  ];
}
