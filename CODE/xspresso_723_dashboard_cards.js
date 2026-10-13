// xspresso_723_dashboard_cards.js
// Dashboard summary helpers.

export function buildDashboardSummary(state = {}) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const monitoredAds = campaigns.reduce((sum, c) => sum + Number(c.monitoredAds || 0), 0);

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'live').length,
    drafts: campaigns.filter((c) => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining: Number(state.creditsRemaining || 0),
    monitoredAds,
  };
}

export function buildCampaignCard(campaign = {}) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'general',
    cpc: campaign.cpc || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    alerts: campaign.alerts || 0,
  };
}
