// xspresso_414_campaign_editor.js
// Campaign editing helpers for Xspresso V1

const EDITABLE_SECTIONS = [
  'headline',
  'subheadline',
  'hooks',
  'ads',
  'landingPage',
  'shoppingCart',
  'leadMagnet',
  'followUpEmails',
  'platformVersions',
];

export function listEditableSections() {
  return [...EDITABLE_SECTIONS];
}

export function updateSection(campaign, sectionName, newValue) {
  if (!campaign || !sectionName) return campaign;

  return {
    ...campaign,
    [sectionName]: newValue,
    updatedAt: new Date().toISOString(),
    status: 'draft',
  };
}

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign?.approvedSections || []);
  approved.add(sectionName);

  return {
    ...campaign,
    approvedSections: Array.from(approved),
    updatedAt: new Date().toISOString(),
  };
}

export function unapproveSection(campaign, sectionName) {
  return {
    ...campaign,
    approvedSections: (campaign?.approvedSections || []).filter((item) => item !== sectionName),
    updatedAt: new Date().toISOString(),
  };
}

export function regenerateSection(campaign, sectionName, prompt = '') {
  if (!campaign || !sectionName) return campaign;

  const regeneratedValue = {
    sectionName,
    prompt,
    text: `Regenerated ${sectionName} content`,
  };

  return {
    ...campaign,
    [sectionName]: regeneratedValue,
    lastRegeneratedSection: sectionName,
    regenerationPrompt: prompt,
    updatedAt: new Date().toISOString(),
    status: 'draft',
  };
}

export function regenerateAll(campaign) {
  if (!campaign) return campaign;

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
    lastRegeneratedSection: 'all',
    updatedAt: new Date().toISOString(),
    status: 'draft',
  };
}

export function getReviewSummary(campaign = {}) {
  const approvedSections = campaign.approvedSections || [];
  return {
    title: campaign.headline || 'Untitled Campaign',
    approvedCount: approvedSections.length,
    totalEditableSections: EDITABLE_SECTIONS.length,
    isLaunchReady: Boolean(campaign.launchReady),
    status: campaign.status || 'draft',
  };
}

export default {
  listEditableSections,
  updateSection,
  approveSection,
  unapproveSection,
  regenerateSection,
  regenerateAll,
  getReviewSummary,
};
