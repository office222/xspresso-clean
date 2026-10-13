// xspresso_666_campaign_storage.js
// Campaign creation, storage, duplication, and version helpers

function createCampaignBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || 'A product or offer needing a campaign.',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    templateType: input.templateType || 'basic',
    notes: input.notes || ''
  };
}

function createCampaignFromBrief(brief) {
  return {
    id: `cmp_${Date.now()}`,
    name: brief.productName || 'Untitled Campaign',
    status: 'draft',
    platform: brief.platform,
    brief,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    approvedSections: [],
    assets: {
      headlines: [],
      hooks: [],
      ads: [],
      landingPage: {},
      shoppingCart: {},
      leadMagnet: {},
      followUpEmails: []
    }
  };
}

function duplicateCampaign(campaign, overrides = {}) {
  return {
    ...campaign,
    id: `cmp_${Date.now()}`,
    name: overrides.name || `${campaign.name || 'Campaign'} Copy`,
    status: 'draft',
    version: 1,
    approvedSections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function saveVersion(campaign, note = '') {
  return {
    versionId: `ver_${Date.now()}`,
    campaignId: campaign.id,
    versionNumber: (campaign.version || 1) + 1,
    savedAt: new Date().toISOString(),
    note,
    data: JSON.parse(JSON.stringify(campaign))
  };
}

function restoreVersion(version) {
  return {
    ...version.data,
    version: version.versionNumber,
    status: 'draft',
    restoredAt: new Date().toISOString()
  };
}

function updateCampaignSection(campaign, sectionName, value) {
  return {
    ...campaign,
    assets: {
      ...(campaign.assets || {}),
      [sectionName]: value
    },
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  createCampaignBrief,
  createCampaignFromBrief,
  duplicateCampaign,
  saveVersion,
  restoreVersion,
  updateCampaignSection
};