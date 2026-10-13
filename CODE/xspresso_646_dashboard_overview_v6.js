export function buildDashboardOverview({ campaigns = [], alerts = [], creditsRemaining = 0, monitoredAds = 0, platformConnections = 0 } = {}) {
  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'live').length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining,
    monitoredAds,
    platformConnections,
    recentCampaigns: campaigns.slice(0, 6).map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      platform: c.platform || 'Multiple',
      cpc: c.cpc ?? 0,
      ctr: c.ctr ?? 0,
      conversions: c.conversions ?? 0
    })),
    recentAlerts: alerts.slice(0, 5)
  };
}

export function buildCampaignSummary(campaign = {}) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc ?? 0,
    ctr: campaign.ctr ?? 0,
    conversions: campaign.conversions ?? 0,
    monitoredAds: campaign.monitoredAds ?? 0,
    alerts: campaign.alerts ?? 0,
    lastUpdated: campaign.lastUpdated || new Date().toISOString()
  };
}

export function getDashboardPrimaryAction(stats = {}) {
  if ((stats.alerts || 0) > 0) return 'Review Alerts';
  if ((stats.drafts || 0) > 0) return 'Resume Draft';
  return 'Create Campaign';
}