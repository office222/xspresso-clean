// xspresso_665_dashboard_renderer.js
// Dashboard helpers and render data assembly for Xspresso

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function buildCampaignCard(campaign) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    monitoredAds: campaign.monitoredAds || 0,
    alerts: campaign.alerts || 0,
    lastUpdated: campaign.lastUpdated || new Date().toISOString()
  };
}

function buildDashboardOverview(state) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  return {
    userName: state.user?.name || 'Welcome back',
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'live').length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining: state.user?.creditsRemaining || 0,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
    platformConnections: state.user?.platformConnections || 0,
    campaigns: campaigns.map(buildCampaignCard),
    recentAlerts: alerts.slice(0, 5)
  };
}

function renderMetric(label, value) {
  return { label, value: formatNumber(value) };
}

function buildDashboardMetrics(state) {
  const overview = buildDashboardOverview(state);
  return [
    renderMetric('Total Campaigns', overview.totalCampaigns),
    renderMetric('Active Campaigns', overview.activeCampaigns),
    renderMetric('Drafts', overview.drafts),
    renderMetric('Alerts', overview.alerts),
    renderMetric('Credits Remaining', overview.creditsRemaining)
  ];
}

module.exports = {
  buildCampaignCard,
  buildDashboardOverview,
  buildDashboardMetrics
};