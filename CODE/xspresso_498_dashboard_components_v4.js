export function buildDashboardSummary(state) {
  return {
    totalCampaigns: state.campaigns?.length || 0,
    activeCampaigns: (state.campaigns || []).filter(c => c.status === 'live').length,
    drafts: (state.campaigns || []).filter(c => c.status === 'draft').length,
    alerts: state.alerts?.length || 0,
    creditsRemaining: state.creditsRemaining || 0,
    monitoredAds: state.monitoredAds || 0
  };
}

export function buildCampaignCard(campaign) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    alerts: campaign.alerts || 0,
    monitoringStatus: campaign.monitoringStatus || 'active'
  };
}

export function getStatusLabel(status) {
  const map = {
    live: 'Live',
    draft: 'Draft',
    needs_attention: 'Needs Attention',
    underperforming: 'Underperforming',
    paused: 'Paused'
  };

  return map[status] || 'Unknown';
}
