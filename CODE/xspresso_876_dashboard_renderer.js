// xspresso_876_dashboard_renderer.js
// Dashboard summary and card rendering helpers.

export function buildDashboardModel(state = {}) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const credits = state.credits || { included: 0, used: 0 };

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'live').length,
    drafts: campaigns.filter((c) => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining: Math.max((credits.included || 0) - (credits.used || 0), 0),
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
    recentAlerts: alerts.slice(0, 5),
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name || 'Untitled Campaign',
      status: c.status || 'draft',
      platform: c.platform || 'Multiple',
      cpc: c.cpc ?? 0,
      ctr: c.ctr ?? 0,
      conversions: c.conversions ?? 0,
    })),
  };
}

export function renderDashboardCards(model) {
  return `
    <section class="dashboard-grid">
      <article class="card"><h3>${model.totalCampaigns}</h3><p>Total Campaigns</p></article>
      <article class="card"><h3>${model.activeCampaigns}</h3><p>Active Campaigns</p></article>
      <article class="card"><h3>${model.alerts}</h3><p>Alerts</p></article>
      <article class="card"><h3>${model.creditsRemaining}</h3><p>Credits Remaining</p></article>
    </section>
  `;
}
