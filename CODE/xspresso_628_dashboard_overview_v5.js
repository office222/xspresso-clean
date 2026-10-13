// xspresso_628_dashboard_overview_v5.js

export function buildDashboardOverview({ user = {}, campaigns = [], alerts = [], activities = [] }) {
  const activeCampaigns = campaigns.filter(c => c.status === 'live').length;
  const drafts = campaigns.filter(c => c.status === 'draft').length;
  const monitoredAds = campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0);

  return {
    userName: user.name || 'Welcome back',
    totalCampaigns: campaigns.length,
    activeCampaigns,
    drafts,
    alerts: alerts.length,
    creditsRemaining: user.creditsRemaining ?? 0,
    monitoredAds,
    platformConnections: user.platformConnections ?? 0,
    recentActivity: activities.slice(0, 5),
    campaigns: campaigns.map(c => ({
      id: c.id,
      name: c.name || 'Untitled Campaign',
      status: c.status || 'draft',
      platform: c.platform || 'Multiple',
      cpc: c.cpc ?? 0,
      ctr: c.ctr ?? 0,
      conversions: c.conversions ?? 0,
      alerts: c.alerts ?? 0,
      monitoringStatus: c.monitoringStatus || 'active',
    })),
  };
}
