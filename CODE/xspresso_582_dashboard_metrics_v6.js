// xspresso_582_dashboard_metrics_v6.js
// Dashboard metrics helpers for Xspresso.

export function summarizeDashboard({ campaigns = [], alerts = [], credits = {}, activity = [] }) {
  const activeCampaigns = campaigns.filter(c => c.status === 'live').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
  const underperformingCampaigns = campaigns.filter(c => c.status === 'underperforming').length;
  const monitoredAds = campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0);

  return {
    totals: {
      campaigns: campaigns.length,
      activeCampaigns,
      draftCampaigns,
      underperformingCampaigns,
      alerts: alerts.length,
      monitoredAds,
      recentActivity: activity.slice(0, 10).length,
    },
    credits: {
      included: credits.included || 0,
      used: credits.used || 0,
      remaining: Math.max((credits.included || 0) - (credits.used || 0), 0),
    },
    health: buildHealthSignal(campaigns, alerts, credits),
  };
}

export function buildHealthSignal(campaigns = [], alerts = [], credits = {}) {
  const underperforming = campaigns.filter(c => c.status === 'underperforming').length;
  const criticalAlerts = alerts.filter(a => a.level === 'critical').length;
  const remaining = Math.max((credits.included || 0) - (credits.used || 0), 0);

  if (criticalAlerts > 0 || underperforming > 0) {
    return { level: 'critical', message: 'One or more campaigns need attention.' };
  }

  if (remaining <= (credits.included || 0) * 0.2) {
    return { level: 'warning', message: 'Credits are running low.' };
  }

  return { level: 'good', message: 'Dashboard is healthy.' };
}

export function dashboardCardsFromCampaigns(campaigns = []) {
  return campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc ?? null,
    ctr: campaign.ctr ?? null,
    conversions: campaign.conversions ?? 0,
    monitoringStatus: campaign.monitoringStatus || 'active',
    alerts: campaign.alerts || 0,
  }));
}
