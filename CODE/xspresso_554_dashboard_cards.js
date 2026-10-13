// xspresso_554_dashboard_cards.js
// Dashboard summary/card helpers for Xspresso V1.

export function buildDashboardSummary({ campaigns = [], alerts = [], creditsRemaining = 0, monitoredAds = 0, platformConnections = 0 } = {}) {
  const activeCampaigns = campaigns.filter((c) => c.status === 'live').length;
  const drafts = campaigns.filter((c) => c.status === 'draft').length;

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    drafts,
    alerts: alerts.length,
    creditsRemaining,
    monitoredAds,
    platformConnections
  };
}

export function buildCampaignCard(campaign = {}) {
  return {
    id: campaign.id || null,
    name: campaign.productName || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: Array.isArray(campaign.platforms) ? campaign.platforms.join(', ') : 'Multiple',
    cpc: Number(campaign.cpc || 0),
    ctr: Number(campaign.ctr || 0),
    conversions: Number(campaign.conversions || 0),
    alerts: Number(campaign.alerts || 0),
    updatedAt: campaign.updatedAt || null
  };
}

export function getStatusBadge(status = 'draft') {
  const map = {
    live: { label: 'Live', color: 'green' },
    draft: { label: 'Draft', color: 'gray' },
    needs_review: { label: 'Needs Review', color: 'orange' },
    underperforming: { label: 'Underperforming', color: 'red' },
    paused: { label: 'Paused', color: 'blue' }
  };

  return map[status] || { label: 'Unknown', color: 'gray' };
}