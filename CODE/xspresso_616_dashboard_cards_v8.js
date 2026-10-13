// xspresso_616_dashboard_cards_v8.js
// Dashboard summary card builders for Xspresso

export function buildCampaignCard(campaign = {}) {
  return {
    id: campaign.id || `cmp_${Date.now()}`,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc ?? 0,
    ctr: campaign.ctr ?? 0,
    conversions: campaign.conversions ?? 0,
    alerts: campaign.alerts ?? 0,
    monitored: campaign.monitored ?? false,
    lastUpdated: campaign.lastUpdated || new Date().toISOString(),
  };
}

export function buildDashboardSummary(campaigns = [], creditsRemaining = 0, notifications = 0) {
  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'live').length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    alerts: notifications,
    creditsRemaining,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
  };
}

export function getStatusBadge(status = 'draft') {
  const map = {
    live: { label: 'Live', tone: 'green' },
    draft: { label: 'Draft', tone: 'gray' },
    needs_attention: { label: 'Needs Attention', tone: 'orange' },
    underperforming: { label: 'Underperforming', tone: 'red' },
    paused: { label: 'Paused', tone: 'blue' },
  };
  return map[status] || { label: 'Unknown', tone: 'gray' };
}
