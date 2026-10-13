export function buildDashboardCards(summary = {}) {
  return [
    { label: 'Campaigns', value: summary.totalCampaigns || 0 },
    { label: 'Active', value: summary.activeCampaigns || 0 },
    { label: 'Drafts', value: summary.drafts || 0 },
    { label: 'Alerts', value: summary.alerts || 0 },
    { label: 'Credits Left', value: summary.creditsRemaining || 0 },
    { label: 'Monitored Ads', value: summary.monitoredAds || 0 }
  ];
}

export function buildCampaignCard(campaign = {}) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc ?? 0,
    ctr: campaign.ctr ?? 0,
    conversions: campaign.conversions ?? 0,
    alerts: campaign.alerts ?? 0,
    monitoringStatus: campaign.monitoringStatus || 'active'
  };
}
