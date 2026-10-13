document.addEventListener('DOMContentLoaded', () => {
  const state = {
    user: window.XspressoData.user,
    campaigns: [...window.XspressoData.campaigns],
    alerts: [...window.XspressoData.alerts],
    draft: null
  };

  const statCampaigns = document.getElementById('stat-campaigns');
  const statAlerts = document.getElementById('stat-alerts');
  const statCredits = document.getElementById('stat-credits');
  const alertsList = document.getElementById('alerts-list');
  const draftPreview = document.getElementById('draft-preview');
  const campaignForm = document.getElementById('campaign-form');

  function readForm() {
    const formData = new FormData(campaignForm);
    return Object.fromEntries(formData.entries());
  }

  function renderStats() {
    statCampaigns.textContent = state.campaigns.length;
    statAlerts.textContent = state.alerts.length;
    statCredits.textContent = state.user.creditsRemaining;
  }

  function renderAlerts() {
    const items = state.alerts.map(alert => `
      <article class="alert-item ${alert.level}">
        <h3>${alert.title}</h3>
        <p>${alert.message}</p>
        <div class="alert-actions">
          <button class="small-btn" data-alert-action="regenerate">${alert.action}</button>
          <button class="small-btn" data-alert-action="dismiss">Dismiss</button>
        </div>
      </article>
    `).join('');

    alertsList.innerHTML = items || '<p class="muted">No alerts right now. Xspresso is keeping watch.</p>';
  }

  function renderDraft() {
    if (!state.draft) {
      draftPreview.innerHTML = '<p class="muted">No draft yet. Create one from the builder above.</p>';
      return;
    }

    const draft = state.draft;
    draftPreview.innerHTML = `
      <div class="section-card">
        <p class="eyebrow">${draft.brief.productName}</p>
        <h3>${draft.headline}</h3>
        <p>${draft.subheadline}</p>
        <p><strong>Hooks</strong></p>
        <ul>${draft.hooks.map(h => `<li>${h}</li>`).join('')}</ul>
        <p><strong>Ads</strong></p>
        <ul>${draft.ads.map(a => `<li>${a}</li>`).join('')}</ul>
        <p><strong>Landing page</strong></p>
        <p>${draft.landingPage.body}</p>
        <p><strong>Follow-up</strong></p>
        <ul>${draft.followUp.map(m => `<li>${m}</li>`).join('')}</ul>
      </div>
    `;
  }

  function generateDraft() {
    const brief = window.XspressoCampaignBuilder.buildBrief(readForm());
    state.draft = window.XspressoCampaignBuilder.generateDraft(brief);
    state.alerts = [
      ...window.XspressoData.alerts,
      ...window.XspressoMonitoring.evaluateCampaign({
        id: 'preview',
        cpc: 1.2,
        ctr: 0.9,
        conversions: 1
      })
    ];
    renderStats();
    renderAlerts();
    renderDraft();
  }

  function regenerateDraft() {
    if (!state.draft) return;
    state.draft = window.XspressoCampaignBuilder.generateDraft(state.draft.brief);
    renderDraft();
  }

  function refreshMonitoring() {
    const evaluated = state.campaigns.flatMap(c => window.XspressoMonitoring.evaluateCampaign(c));
    state.alerts = [...window.XspressoData.alerts, ...evaluated];
    renderStats();
    renderAlerts();
  }

  function handleClick(e) {
    const action = e.target?.dataset?.action;
    if (!action) return;

    if (action === 'generate-draft' || action === 'create-campaign') generateDraft();
    if (action === 'regenerate-draft') regenerateDraft();
    if (action === 'refresh-monitoring') refreshMonitoring();
    if (action === 'see-pricing') document.getElementById('billing')?.scrollIntoView({ behavior: 'smooth' });
  }

  document.addEventListener('click', handleClick);

  renderStats();
  renderAlerts();
  renderDraft();
});
