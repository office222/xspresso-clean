// xspresso_739_campaign_store_v2.js
// Campaign state, versions, and storage helpers

const storageKey = 'xspresso_campaigns_v2';

export function loadCampaigns() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
}

export function saveCampaigns(campaigns = []) {
  localStorage.setItem(storageKey, JSON.stringify(campaigns));
  return campaigns;
}

export function addCampaign(campaign, campaigns = loadCampaigns()) {
  const next = [...campaigns, { ...campaign, id: campaign.id || `cmp_${Date.now()}` }];
  saveCampaigns(next);
  return next;
}

export function updateCampaign(campaignId, updates, campaigns = loadCampaigns()) {
  const next = campaigns.map(c => (c.id === campaignId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
  saveCampaigns(next);
  return next;
}

export function duplicateCampaign(campaignId, campaigns = loadCampaigns()) {
  const source = campaigns.find(c => c.id === campaignId);
  if (!source) return campaigns;
  const copy = {
    ...source,
    id: `cmp_${Date.now()}`,
    name: `${source.name || 'Untitled Campaign'} Copy`,
    status: 'draft',
    duplicatedFrom: source.id
  };
  const next = [...campaigns, copy];
  saveCampaigns(next);
  return next;
}

export function saveCampaignVersion(campaignId, versionNote = '', campaigns = loadCampaigns()) {
  const next = campaigns.map(c => {
    if (c.id !== campaignId) return c;
    const versions = c.versions || [];
    return {
      ...c,
      versions: [
        ...versions,
        {
          id: `ver_${Date.now()}`,
          note: versionNote,
          createdAt: new Date().toISOString(),
          snapshot: { ...c }
        }
      ]
    };
  });
  saveCampaigns(next);
  return next;
}
