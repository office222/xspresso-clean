export function buildDashboardCards(state = {}) {
  const cards = [
    {
      title: 'Active Campaigns',
      value: state.activeCampaigns ?? 0,
      tone: 'green'
    },
    {
      title: 'Drafts',
      value: state.drafts ?? 0,
      tone: 'gray'
    },
    {
      title: 'Alerts',
      value: state.alerts ?? 0,
      tone: 'orange'
    },
    {
      title: 'Credits Remaining',
      value: state.creditsRemaining ?? 0,
      tone: 'blue'
    }
  ];

  return cards.map(card => `
    <article class="metric-card metric-${card.tone}">
      <p class="metric-title">${card.title}</p>
      <p class="metric-value">${card.value}</p>
    </article>
  `).join('');
}

export function buildCampaignCard(campaign) {
  return `
    <article class="campaign-card">
      <header>
        <h3>${campaign.name}</h3>
        <span class="status status-${campaign.status}">${campaign.status}</span>
      </header>
      <ul class="campaign-stats">
        <li><strong>Platform:</strong> ${campaign.platform}</li>
        <li><strong>CPC:</strong> ${campaign.cpc}</li>
        <li><strong>CTR:</strong> ${campaign.ctr}</li>
        <li><strong>Conversions:</strong> ${campaign.conversions}</li>
      </ul>
      <footer class="campaign-actions">
        <button data-action="view" data-id="${campaign.id}">View</button>
        <button data-action="edit" data-id="${campaign.id}">Edit</button>
        <button data-action="regenerate" data-id="${campaign.id}">Regenerate</button>
      </footer>
    </article>
  `;
}
