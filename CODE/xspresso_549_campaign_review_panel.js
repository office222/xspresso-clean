// xspresso_549_campaign_review_panel.js
// Review / approve / regenerate panel helpers for Xspresso

export const tweakActions = {
  approve: 'approve',
  edit: 'edit',
  regenerate: 'regenerate',
  regenerateAll: 'regenerate_all',
  save: 'save',
  launch: 'launch',
};

export function approveSection(campaign = {}, sectionName) {
  const approved = Array.isArray(campaign.approvedSections) ? [...campaign.approvedSections] : [];
  if (!approved.includes(sectionName)) approved.push(sectionName);
  return { ...campaign, approvedSections: approved };
}

export function unapproveSection(campaign = {}, sectionName) {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter(section => section !== sectionName),
  };
}

export function updateSection(campaign = {}, sectionName, newValue) {
  return { ...campaign, [sectionName]: newValue, status: 'draft', updatedAt: new Date().toISOString() };
}

export function regenerateSection(campaign = {}, sectionName, prompt = '') {
  return {
    ...campaign,
    [sectionName]: `Regenerated ${sectionName} content`,
    status: 'draft',
    lastRegeneratedSection: sectionName,
    regenerationPrompt: prompt,
    updatedAt: new Date().toISOString(),
  };
}

export function regenerateAll(campaign = {}) {
  return {
    ...campaign,
    headline: 'Wake up your marketing.',
    subheadline: 'More responses. Less software chaos.',
    hooks: [],
    ads: [],
    landingPage: {},
    shoppingCart: {},
    leadMagnet: {},
    followUpEmails: [],
    platformVersions: {},
    approvedSections: [],
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };
}
