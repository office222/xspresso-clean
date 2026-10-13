// xspresso_826_dashboard_cards.js
// Simple dashboard card builders.

export function buildCampaignCard(campaign) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc ?? 0,
    ctr: campaign.ctr ?? 0,
    conversions: campaign.conversions ?? 0,
    monitoredAds: campaign.monitoredAds ?? 0,
    alerts: campaign.alerts ?? 0,
    lastUpdated: campaign.lastUpdated || new Date().toISOString()
  };
}

export function buildDashboardSummary(user, campaigns = [], alerts = []) {
  const liveCount = campaigns.filter(c => c.status === 'live').length;
  const draftCount = campaigns.filter(c => c.status === 'draft').length;

  return {
    userName: user?.name || 'Welcome back',
    totalCampaigns: campaigns.length,
    activeCampaigns: liveCount,
    drafts: draftCount,
    alerts: alerts.length,
    creditsRemaining: user?.creditsRemaining ?? 0,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
    campaigns: campaigns.map(buildCampaignCard),
    recentAlerts: alerts.slice(0, 5)
  };
}

export function statusBadge(status) {
  const map = {
    live: { label: 'Live', tone: 'green' },
    draft: { label: 'Draft', tone: 'gray' },
    needs_attention: { label: 'Needs Attention', tone: 'orange' },
    underperforming: { label: 'Underperforming', tone: 'red' },
    paused: { label: 'Paused', tone: 'blue' }
  };

  return map[status] || { label: 'Unknown', tone: 'gray' };
}
