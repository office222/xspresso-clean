// xspresso_751_dashboard_view.js
export function renderDashboard(state, store) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const creditsRemaining = state.user?.creditsRemaining ?? 0;

  const campaignCards = campaigns.length
    ? campaigns.map(c => `
      <li>
        <strong>${escapeHtml(c.name || 'Untitled Campaign')}</strong><br>
        <span class="tag ${badgeClass(c.status)}">${escapeHtml(c.status || 'draft')}</span>
        <div style="margin-top:8px;color:#616161;">${escapeHtml(c.summary || 'No summary yet.')}</div>
      </li>
    `).join('')
    : '<li>No campaigns yet. Start by creating one.</li>';

  const alertCards = alerts.length
    ? alerts.map(a => `
      <li>
        <strong>${escapeHtml(a.title || 'Alert')}</strong><br>
        <span class="tag ${alertTag(a.level)}">${escapeHtml(a.level || 'info')}</span>
        <div style="margin-top:8px;color:#616161;">${escapeHtml(a.message || '')}</div>
      </li>
    `).join('')
    : '<li>No alerts right now.</li>';

  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <img src="images/Xspresso_cup.gif" alt="Xspresso cup">
          <div>
            <div class="brand-title">Xspresso</div>
            <div class="brand-subtitle">Done-for-you marketing. You stay in command.</div>
          </div>
        </div>
        <div class="nav">
          <button class="primary" onclick="window.xspresso.go('campaign')">Create Campaign</button>
          <button onclick="window.xspresso.go('monitoring')">Monitoring</button>
        </div>
      </header>
      <main class="content">
        <div class="grid">
          <section class="card">
            <h2>Credits</h2>
            <div class="metric">${creditsRemaining}</div>
            <p>All plans include every tool. Credits determine fair usage.</p>
          </section>
          <section class="card">
            <h2>Campaigns</h2>
            <div class="metric">${campaigns.length}</div>
            <p>Active and draft campaigns are listed below.</p>
          </section>
          <section class="card">
            <h2>Alerts</h2>
            <div class="metric">${alerts.length}</div>
            <p>Warnings and recommendations from monitoring.</p>
          </section>

          <section class="card wide">
            <div class="section-title">
              <h3>Campaigns</h3>
              <button class="btn primary" onclick="window.xspresso.go('campaign')">Create Campaign</button>
            </div>
            <ul class="list">${campaignCards}</ul>
          </section>

          <section class="card wide">
            <div class="section-title">
              <h3>Recent Alerts</h3>
              <button class="btn" onclick="window.xspresso.go('monitoring')">View Monitoring</button>
            </div>
            <ul class="list">${alertCards}</ul>
          </section>
        </div>
      </main>
    </div>
  `;
}

function badgeClass(status) {
  switch (status) {
    case 'live': return 'success';
    case 'warning': return 'warning';
    case 'critical': return 'danger';
    default: return '';
  }
}

function alertTag(level) {
  switch (level) {
    case 'warning': return 'warning';
    case 'critical': return 'danger';
    default: return 'success';
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
