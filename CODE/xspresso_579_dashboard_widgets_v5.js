export function buildDashboardSummary(user = {}, campaigns = [], alerts = []) {
  return {
    userName: user.name || "Welcome back",
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === "live").length,
    drafts: campaigns.filter(c => c.status === "draft").length,
    alerts: alerts.length,
    creditsRemaining: user.creditsRemaining || 0,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0)
  };
}

export function buildCampaignCard(campaign = {}) {
  return {
    id: campaign.id,
    name: campaign.name || "Untitled Campaign",
    status: campaign.status || "draft",
    platform: campaign.platform || "Multiple",
    cpc: campaign.cpc || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    alerts: campaign.alerts || 0
  };
}
