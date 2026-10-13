/* Xspresso v2 - dashboard overview */

export function buildCampaignSummary(campaign = {}) {
  return {
    id: campaign.id,
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

export function buildDashboardOverview(user = {}, campaigns = [], alerts = []) {
  return {
    userName: user.name || "Welcome back",
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === "live").length,
    drafts: campaigns.filter(c => c.status === "draft").length,
    alerts: alerts.length,
    creditsRemaining: user.creditsRemaining || 0,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
    platformConnections: user.platformConnections || 0,
    campaigns: campaigns.map(buildCampaignSummary),
    recentAlerts: alerts.slice(0, 5)
  };
}

export function buildAlertCard(alert = {}) {
  return {
    id: alert.id,
    title: alert.title || "Campaign alert",
    message: alert.message || "",
    level: alert.level || "warning",
    status: alert.status || "open",
    campaignId: alert.campaignId || null,
    createdAt: alert.createdAt || new Date().toISOString()
  };
}

export function getStatusBadge(status = "draft") {
  switch (status) {
    case "live": return { label: "Live", color: "green" };
    case "draft": return { label: "Draft", color: "gray" };
    case "needs_attention": return { label: "Needs Attention", color: "orange" };
    case "underperforming": return { label: "Underperforming", color: "red" };
    case "paused": return { label: "Paused", color: "blue" };
    default: return { label: "Unknown", color: "gray" };
  }
}
