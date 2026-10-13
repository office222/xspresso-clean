// Xspresso Review / Approve / Regenerate Panel v2

export const sectionNames = [
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

export function approveSection(campaign, sectionName) {
  const approvedSections = new Set(campaign.approvedSections || []);
  approvedSections.add(sectionName);
  return { ...campaign, approvedSections: Array.from(approvedSections) };
}

export function unapproveSection(campaign, sectionName) {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter((s) => s !== sectionName),
  };
}

export function updateSection(campaign, sectionName, newValue) {
  return {
    ...campaign,
    [sectionName]: newValue,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };
}

export function regenerateSection(campaign, sectionName, prompt = '') {
  return {
    ...campaign,
    [sectionName]: `Regenerated ${sectionName} content`,
    lastRegeneratedSection: sectionName,
    regenerationPrompt: prompt,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };
}

export function regenerateAll(campaign) {
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

export function buildReviewSummary(campaign) {
  return {
    title: campaign.headline || 'Draft Campaign',
    approvedCount: (campaign.approvedSections || []).length,
    sectionCount: sectionNames.length,
    hasLaunchableContent: Boolean(campaign.headline && campaign.landingPage),
  };
}
