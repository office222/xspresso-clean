export function createDashboardCards(state = {}) {
  const cards = [
    { label: 'Active Campaigns', value: state.activeCampaigns || 0 },
    { label: 'Drafts', value: state.drafts || 0 },
    { label: 'Alerts', value: state.alerts || 0 },
    { label: 'Credits Remaining', value: state.creditsRemaining || 0 }
  ];

  const wrap = document.createElement('div');
  wrap.className = 'dashboard-cards';

  cards.forEach(card => {
    const el = document.createElement('article');
    el.className = 'dashboard-card';
    el.innerHTML = `
      <div class="card-label">${card.label}</div>
      <div class="card-value">${card.value}</div>
    `;
    wrap.appendChild(el);
  });

  return wrap;
}
