// xspresso_820_dashboard_overview_v12.js
// Dashboard overview helpers for Xspresso

export function buildDashboardOverview(state = {}) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const leads = state.leads || [];

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === "live").length,
    drafts: campaigns.filter(c => c.status === "draft").length,
    alerts: alerts.length,
    leads: leads.length,
    creditsRemaining: state.credits || 0,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
    recentCampaigns: campaigns.slice(-5).reverse(),
    recentAlerts: alerts.slice(-5).reverse(),
  };
}

export function buildCampaignCard(campaign) {
  return {
    id: campaign.id,
    name: campaign.name || "Untitled Campaign",
    status: campaign.status || "draft",
    platform: campaign.platform || "Multiple",
    cpc: campaign.cpc || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    monitoringStatus: campaign.monitoringStatus || "active",
  };
}
