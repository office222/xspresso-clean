// Xspresso dashboard widgets v2
// Helper renderers for dashboard summary cards.

export function buildDashboardSummary(data = {}) {
  return {
    totalCampaigns: data.totalCampaigns || 0,
    activeCampaigns: data.activeCampaigns || 0,
    drafts: data.drafts || 0,
    alerts: data.alerts || 0,
    creditsRemaining: data.creditsRemaining || 0,
    monitoredAds: data.monitoredAds || 0,
    platformConnections: data.platformConnections || 0
  };
}

export function buildCampaignCard(campaign = {}) {
  return {
    id: campaign.id || "",
    name: campaign.name || "Untitled Campaign",
    status: campaign.status || "draft",
    platform: campaign.platform || "Multiple",
    cpc: campaign.cpc || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    alerts: campaign.alerts || 0,
    monitoringStatus: campaign.monitoringStatus || "active"
  };
}
