// xspresso_753_monitoring_view.js
export function renderMonitoringView(state, store) {
  const alerts = state.alerts || [];
  const campaigns = state.campaigns || [];

  const rows = campaigns.map(c => {
    const health = campaignHealth(c);
    return `
      <li>
        <strong>${escapeHtml(c.name || 'Untitled Campaign')}</strong><br>
        <span class="tag ${health.tag}">${health.label}</span>
        <div style="margin-top:8px;color:#616161;">${escapeHtml(health.message)}</div>
      </li>
    `;
  }).join('') || '<li>No campaigns to monitor yet.</li>';

  const alertRows = alerts.map(a => `
    <li>
      <strong>${escapeHtml(a.title)}</strong><br>
      <div style="margin-top:8px;color:#616161;">${escapeHtml(a.message)}</div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn" onclick="window.xspresso.dismissAlert && window.xspresso.dismissAlert('${escapeHtml(a.id)}')">Dismiss</button>
      </div>
    </li>
  `).join('') || '<li>No alerts right now.</li>';

  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <img src="images/Xspresso_cup.gif" alt="Xspresso cup">
          <div>
            <div class="brand-title">Monitoring</div>
            <div class="brand-subtitle">Xspresso watches for changes and flags what matters.</div>
          </div>
        </div>
        <div class="nav">
          <button onclick="window.xspresso.go('dashboard')">Dashboard</button>
          <button class="primary" onclick="window.xspresso.go('campaign')">Create Campaign</button>
        </div>
      </header>
      <main class="content">
        <div class="grid">
          <section class="card wide">
            <div class="section-title">
              <h2>Monitored Campaigns</h2>
              <span class="tag">${campaigns.length} total</span>
            </div>
            <ul class="list">${rows}</ul>
          </section>
          <section class="card wide">
            <div class="section-title">
              <h2>Alerts</h2>
              <span class="tag warning">${alerts.length} open</span>
            </div>
            <ul class="list">${alertRows}</ul>
          </section>
        </div>
      </main>
    </div>
  `;
}

function campaignHealth(campaign) {
  const cpc = Number(campaign.cpc || 0);
  const ctr = Number(campaign.ctr || 0);
  const conversions = Number(campaign.conversions || 0);

  if (conversions === 0 && cpc > 1.5) {
    return { tag: 'danger', label: 'Underperforming', message: 'Regenerate this ad with a new title, hook, or angle.' };
  }
  if (cpc > 1.2 || ctr < 0.8) {
    return { tag: 'warning', label: 'Needs Review', message: 'This campaign may need a tweak before more credits are spent.' };
  }
  return { tag: 'success', label: 'Healthy', message: 'Keep monitoring and watch for changes.' };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
