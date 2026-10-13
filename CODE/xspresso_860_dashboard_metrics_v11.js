export function getDashboardMetrics(state) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const monitoredAds = campaigns.reduce((sum, campaign) => sum + (campaign.monitoredAds || 0), 0);
  const liveCampaigns = campaigns.filter((c) => c.status === 'live').length;
  const drafts = campaigns.filter((c) => c.status === 'draft').length;
  const underperforming = campaigns.filter((c) => c.status === 'underperforming').length;

  return {
    totalCampaigns: campaigns.length,
    liveCampaigns,
    drafts,
    alerts: alerts.length,
    monitoredAds,
    underperforming,
    creditsRemaining: Math.max((state.creditsIncluded || 0) - (state.creditsUsed || 0), 0),
  };
}

export function renderMetricsCards(metrics) {
  const cards = [
    ['Campaigns', metrics.totalCampaigns],
    ['Live', metrics.liveCampaigns],
    ['Drafts', metrics.drafts],
    ['Alerts', metrics.alerts],
    ['Monitored Ads', metrics.monitoredAds],
    ['Credits Left', metrics.creditsRemaining],
  ];

  return cards.map(([label, value]) => `
    <div class="metric-card">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
    </div>
  `).join('');
}
