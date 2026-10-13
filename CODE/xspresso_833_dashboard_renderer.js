// xspresso_833_dashboard_renderer.js
export function buildDashboardModel(state = {}) {
  const campaigns = Array.isArray(state.campaigns) ? state.campaigns : [];
  const alerts = Array.isArray(state.alerts) ? state.alerts : [];
  const credits = state.credits || { included: 0, used: 0, remaining: 0 };

  return {
    counts: {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "live").length,
      drafts: campaigns.filter((c) => c.status === "draft").length,
      alerts: alerts.length,
      monitoredAds: campaigns.reduce((sum, c) => sum + Number(c.monitoredAds || 0), 0)
    },
    credits,
    recentAlerts: alerts.slice(0, 5),
    campaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name || "Untitled Campaign",
      status: campaign.status || "draft",
      platform: campaign.platform || "Multiple",
      cpc: Number(campaign.cpc || 0),
      ctr: Number(campaign.ctr || 0),
      conversions: Number(campaign.conversions || 0),
      monitoringStatus: campaign.monitoringStatus || "active"
    }))
  };
}

export function renderDashboardHTML(model) {
  const cards = model.campaigns
    .map((c) => `
      <article class="card">
        <h3>${escapeHtml(c.name)}</h3>
        <p><strong>Status:</strong> ${escapeHtml(c.status)}</p>
        <p><strong>Platform:</strong> ${escapeHtml(c.platform)}</p>
        <p><strong>CPC:</strong> ${c.cpc}</p>
        <p><strong>CTR:</strong> ${c.ctr}%</p>
        <p><strong>Conversions:</strong> ${c.conversions}</p>
      </article>
    `)
    .join("");

  const alerts = model.recentAlerts
    .map((a) => `<li><strong>${escapeHtml(a.title || "Alert")}</strong> — ${escapeHtml(a.message || "")}</li>`)
    .join("");

  return `
    <section class="dashboard-grid">
      <div class="stat"><span>Total</span><strong>${model.counts.totalCampaigns}</strong></div>
      <div class="stat"><span>Active</span><strong>${model.counts.activeCampaigns}</strong></div>
      <div class="stat"><span>Drafts</span><strong>${model.counts.drafts}</strong></div>
      <div class="stat"><span>Alerts</span><strong>${model.counts.alerts}</strong></div>
      <div class="stat"><span>Credits</span><strong>${model.credits.remaining}</strong></div>
    </section>
    <section class="cards">${cards}</section>
    <section class="alerts-panel">
      <h2>Recent Alerts</h2>
      <ul>${alerts}</ul>
    </section>
  `;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
