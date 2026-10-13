// Xspresso dashboard overview helpers

export function buildDashboardOverview({ user = {}, campaigns = [], alerts = [], credits = {} } = {}) {
  return {
    userName: user.name || "Welcome back",
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === "live").length,
    drafts: campaigns.filter(c => c.status === "draft").length,
    alerts: alerts.length,
    creditsRemaining: credits.remaining ?? 0,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
    platformConnections: user.platformConnections || 0,
    recentAlerts: alerts.slice(0, 5),
    recentCampaigns: campaigns.slice(0, 6),
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
    monitoredAds: campaign.monitoredAds || 0,
    alerts: campaign.alerts || 0,
    lastUpdated: campaign.lastUpdated || new Date().toISOString(),
  };
}

export function getStatusBadge(status) {
  switch (status) {
    case "live": return { label: "Live", color: "green" };
    case "draft": return { label: "Draft", color: "gray" };
    case "needs_attention": return { label: "Needs Attention", color: "orange" };
    case "underperforming": return { label: "Underperforming", color: "red" };
    case "paused": return { label: "Paused", color: "blue" };
    default: return { label: "Unknown", color: "gray" };
  }
}

export function summarizeCredits(ledgerEntries = []) {
  const used = ledgerEntries.reduce((sum, item) => sum + (item.amount || 0), 0);
  return { used, remaining: Math.max(0, 0 - used) };
}
