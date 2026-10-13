// xspresso_439_dashboard_overview.js
// Xspresso dashboard overview state helpers.

export function buildDashboardOverview({ campaigns = [], alerts = [], creditsRemaining = 0, monitoredAds = 0 } = {}) {
  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'live').length,
    drafts: campaigns.filter((c) => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining,
    monitoredAds,
    campaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      platform: campaign.platform || 'Multiple',
      cpc: campaign.cpc || 0,
      ctr: campaign.ctr || 0,
      conversions: campaign.conversions || 0,
      monitoringStatus: campaign.monitoringStatus || 'active',
      alertCount: campaign.alertCount || 0,
    })),
    recentAlerts: [...alerts].slice(0, 5),
  };
}

export function getStatusBadge(status = 'draft') {
  switch (status) {
    case 'live':
      return { label: 'Live', color: 'green' };
    case 'draft':
      return { label: 'Draft', color: 'gray' };
    case 'needs_attention':
      return { label: 'Needs Attention', color: 'orange' };
    case 'underperforming':
      return { label: 'Underperforming', color: 'red' };
    case 'paused':
      return { label: 'Paused', color: 'blue' };
    default:
      return { label: 'Unknown', color: 'gray' };
  }
}