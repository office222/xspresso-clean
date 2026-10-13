export function buildDashboardOverview({ user = {}, campaigns = [], alerts = [], credits = {} } = {}) {
  const activeCampaigns = campaigns.filter(c => c.status === 'live').length;
  const drafts = campaigns.filter(c => c.status === 'draft').length;
  const underperforming = campaigns.filter(c => c.status === 'underperforming').length;

  return {
    userName: user.name || 'Welcome back',
    totalCampaigns: campaigns.length,
    activeCampaigns,
    drafts,
    alerts: alerts.length,
    underperforming,
    creditsRemaining: Number.isFinite(credits.remaining) ? credits.remaining : 0,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
    platformConnections: user.platformConnections || 0,
    recentAlerts: alerts.slice(0, 5),
    campaigns: campaigns.map(c => ({
      id: c.id,
      name: c.name || 'Untitled Campaign',
      status: c.status || 'draft',
      platform: c.platform || 'Multiple',
      cpc: c.cpc || 0,
      ctr: c.ctr || 0,
      conversions: c.conversions || 0,
      lastUpdated: c.lastUpdated || null
    }))
  };
}

export function summarizeCampaign(campaign = {}) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    alertCount: campaign.alerts || 0
  };
}
