export function buildDashboardWidgets(state = {}) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const credits = state.credits || { included: 0, used: 0 };

  return {
    stats: [
      { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'live').length },
      { label: 'Drafts', value: campaigns.filter(c => c.status === 'draft').length },
      { label: 'Alerts', value: alerts.length },
      { label: 'Credits Remaining', value: Math.max((credits.included || 0) - (credits.used || 0), 0) }
    ],
    cards: campaigns.slice(0, 6).map(campaign => ({
      id: campaign.id,
      name: campaign.name || 'Untitled Campaign',
      status: campaign.status || 'draft',
      platform: campaign.platform || 'Multiple',
      cpc: campaign.cpc ?? 0,
      ctr: campaign.ctr ?? 0,
      conversions: campaign.conversions ?? 0,
      monitoringStatus: campaign.monitoringStatus || 'active',
      alerts: campaign.alerts || 0
    }))
  };
}
