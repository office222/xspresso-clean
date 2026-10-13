// xspresso_670_dashboard_overview.js
// Dashboard summary helpers for Xspresso.

export function buildDashboardOverview({ campaigns = [], alerts = [], creditsRemaining = 0, monitoredAds = 0 }) {
  const activeCampaigns = campaigns.filter(c => c.status === 'live').length;
  const drafts = campaigns.filter(c => c.status === 'draft').length;
  const needsAttention = campaigns.filter(c => c.status === 'needs_attention' || c.status === 'underperforming').length;

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    drafts,
    needsAttention,
    alerts: alerts.length,
    creditsRemaining,
    monitoredAds,
    recentCampaigns: campaigns.slice(0, 5),
    recentAlerts: alerts.slice(0, 5)
  };
}

export function summarizeCampaign(campaign) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc ?? 0,
    ctr: campaign.ctr ?? 0,
    conversions: campaign.conversions ?? 0,
    updatedAt: campaign.updatedAt || null
  };
}
