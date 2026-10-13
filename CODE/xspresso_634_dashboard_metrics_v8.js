// xspresso_634_dashboard_metrics_v8.js
// Dashboard metrics and summary helpers for Xspresso

export function summarizeCampaigns(campaigns = []) {
  const total = campaigns.length;
  const live = campaigns.filter(c => c.status === 'live').length;
  const drafts = campaigns.filter(c => c.status === 'draft').length;
  const needsAttention = campaigns.filter(c => c.status === 'needs_attention' || c.status === 'underperforming').length;

  return {
    totalCampaigns: total,
    activeCampaigns: live,
    drafts,
    needsAttention,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
    alerts: campaigns.reduce((sum, c) => sum + (c.alertCount || 0), 0)
  };
}

export function buildDashboardCards(campaigns = []) {
  return campaigns.map(c => ({
    id: c.id,
    name: c.name || 'Untitled Campaign',
    platform: c.platform || 'Multiple',
    status: c.status || 'draft',
    cpc: c.cpc || 0,
    ctr: c.ctr || 0,
    conversions: c.conversions || 0,
    alerts: c.alertCount || 0,
    lastUpdated: c.lastUpdated || new Date().toISOString()
  }));
}
