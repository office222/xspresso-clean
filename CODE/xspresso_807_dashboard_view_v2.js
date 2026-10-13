// Xspresso dashboard view v2

export function renderDashboardView(state = {}) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const creditsRemaining = state.creditsRemaining ?? 0;

  const cards = [
    { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'live').length },
    { label: 'Drafts', value: campaigns.filter(c => c.status === 'draft').length },
    { label: 'Alerts', value: alerts.length },
    { label: 'Credits Remaining', value: creditsRemaining }
  ];

  return `
    <section class="page page-dashboard">
      <header class="page-header">
        <h1>Dashboard</h1>
        <p>Xspresso is keeping watch. You stay in command.</p>
      </header>
      <div class="summary-grid">
        ${cards.map(card => `
          <article class="summary-card">
            <div class="summary-label">${card.label}</div>
            <div class="summary-value">${card.value}</div>
          </article>
        `).join('')}
      </div>
      <div class="panel">
        <h2>Recent Activity</h2>
        <ul class="activity-list">
          ${(state.activity || []).slice(0, 5).map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </section>
  `;
}
