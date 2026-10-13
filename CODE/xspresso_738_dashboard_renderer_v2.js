// xspresso_738_dashboard_renderer_v2.js
// Dashboard summary and card rendering helpers

export function buildDashboardSummary(state = {}) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const credits = state.credits || {};

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'live').length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining: credits.remaining ?? 0,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0)
  };
}

export function renderCampaignCard(campaign) {
  const status = campaign.status || 'draft';
  return `
    <article class="campaign-card campaign-${status}">
      <header>
        <h3>${campaign.name || 'Untitled Campaign'}</h3>
        <span class="badge">${status}</span>
      </header>
      <p>Platform: ${campaign.platform || 'Multiple'}</p>
      <p>CPC: ${campaign.cpc ?? '—'} | CTR: ${campaign.ctr ?? '—'} | Conversions: ${campaign.conversions ?? 0}</p>
      <p>Alerts: ${campaign.alerts ?? 0}</p>
    </article>
  `;
}

export function renderDashboard(state = {}, mountEl) {
  const summary = buildDashboardSummary(state);
  const campaigns = state.campaigns || [];

  mountEl.innerHTML = `
    <section class="dashboard-summary">
      <div class="summary-card"><strong>${summary.totalCampaigns}</strong><span>Campaigns</span></div>
      <div class="summary-card"><strong>${summary.activeCampaigns}</strong><span>Active</span></div>
      <div class="summary-card"><strong>${summary.drafts}</strong><span>Drafts</span></div>
      <div class="summary-card"><strong>${summary.alerts}</strong><span>Alerts</span></div>
      <div class="summary-card"><strong>${summary.creditsRemaining}</strong><span>Credits Left</span></div>
      <div class="summary-card"><strong>${summary.monitoredAds}</strong><span>Monitored Ads</span></div>
    </section>
    <section class="dashboard-campaigns">
      ${campaigns.map(renderCampaignCard).join('')}
    </section>
  `;
}
