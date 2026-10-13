window.XspressoDashboard = (() => {
  function renderSummary(state) {
    const alerts = state.alerts || [];
    const campaigns = state.campaigns || [];
    return `
      <div class="card">
        <div class="tag">Dashboard</div>
        <h2 class="card-title">${state.user.name || 'Welcome back'}</h2>
        <p class="card-subtle">${campaigns.length} campaigns • ${alerts.length} alerts • ${state.user.credits || 0} credits remaining</p>
      </div>
    `;
  }

  function renderCampaignCard(campaign) {
    return `
      <div class="card">
        <h3 class="card-title">${campaign.name || 'Untitled Campaign'}</h3>
        <p class="card-subtle">${campaign.status || 'draft'} • ${campaign.platform || 'Multiple'} • CPC ${campaign.cpc ?? '-'} • CTR ${campaign.ctr ?? '-'}</p>
      </div>
    `;
  }

  function mountDashboard(el, state) {
    if (!el) return;
    const campaignCards = (state.campaigns || []).map(renderCampaignCard).join('');
    el.innerHTML = renderSummary(state) + campaignCards;
  }

  return { renderSummary, renderCampaignCard, mountDashboard };
})();
