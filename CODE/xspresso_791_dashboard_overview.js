export function buildDashboardOverview(state = {}) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const leads = state.leads || [];
  const credits = Number(state.credits || 0);

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'live').length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining: credits,
    monitoredAds: campaigns.length,
    leadCount: leads.length,
    recentAlerts: alerts.slice(0, 5),
    campaigns: campaigns.map(c => ({
      id: c.id,
      name: c.name,
      platform: c.platform,
      status: c.status,
      cpc: c.cpc,
      ctr: c.ctr,
      conversions: c.conversions
    }))
  };
}

export function buildKpiCards(overview) {
  return [
    { label: 'Active campaigns', value: overview.activeCampaigns },
    { label: 'Drafts', value: overview.drafts },
    { label: 'Alerts', value: overview.alerts },
    { label: 'Credits remaining', value: overview.creditsRemaining }
  ];
}
