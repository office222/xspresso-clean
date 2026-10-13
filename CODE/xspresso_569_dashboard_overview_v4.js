// Xspresso dashboard overview helpers
// File: xspresso_569_dashboard_overview_v4.js

export function buildDashboardOverview({ campaigns = [], alerts = [], creditsRemaining = 0, monitoredAds = 0, platformConnections = 0, recentActivity = [] } = {}) {
  const activeCampaigns = campaigns.filter(c => c.status === 'live' || c.status === 'monitoring').length;
  const drafts = campaigns.filter(c => c.status === 'draft').length;

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    drafts,
    alerts: alerts.length,
    creditsRemaining,
    monitoredAds,
    platformConnections,
    recentActivity: recentActivity.slice(0, 10),
    campaignCards: campaigns.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      platform: c.platform || 'Multiple',
      cpc: c.cpc ?? null,
      ctr: c.ctr ?? null,
      conversions: c.conversions ?? 0,
      alertCount: c.alertCount ?? 0,
      monitoringStatus: c.monitoringStatus || 'active',
      lastUpdated: c.lastUpdated || null,
    })),
    summary: {
      hasAlerts: alerts.length > 0,
      needsAttention: alerts.some(a => a.level === 'warning' || a.level === 'critical'),
    },
  };
}

export function formatDashboardHeadline(overview) {
  return `${overview.activeCampaigns} active, ${overview.alerts} alerts, ${overview.creditsRemaining} credits left`;
}

export function getDashboardAction(overview) {
  if (overview.alerts > 0) return 'Review alerts';
  if (overview.drafts > 0) return 'Finish drafts';
  return 'Create campaign';
}