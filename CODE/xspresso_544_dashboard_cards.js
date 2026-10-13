// xspresso_544_dashboard_cards.js
// Dashboard card helpers for Xspresso

export function buildCampaignCard(campaign = {}) {
  return {
    id: campaign.id || `cmp_${Date.now()}`,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc ?? 0,
    ctr: campaign.ctr ?? 0,
    conversions: campaign.conversions ?? 0,
    monitoredAds: campaign.monitoredAds ?? 0,
    alerts: campaign.alerts ?? 0,
    lastUpdated: campaign.lastUpdated || new Date().toISOString(),
  };
}

export function getStatusBadge(status = 'draft') {
  const map = {
    live: { label: 'Live', color: 'green' },
    draft: { label: 'Draft', color: 'gray' },
    needs_attention: { label: 'Needs Attention', color: 'orange' },
    underperforming: { label: 'Underperforming', color: 'red' },
    paused: { label: 'Paused', color: 'blue' },
  };
  return map[status] || { label: 'Unknown', color: 'gray' };
}

export function buildDashboardSummary({ campaigns = [], alerts = [], creditsRemaining = 0, monitoredAds = 0, platformConnections = 0, userName = 'Welcome back' } = {}) {
  return {
    userName,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'live').length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining,
    monitoredAds,
    platformConnections,
    campaigns: campaigns.map(buildCampaignCard),
    recentAlerts: alerts.slice(0, 5),
  };
}
