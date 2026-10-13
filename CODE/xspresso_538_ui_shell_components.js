// Xspresso UI Shell Components
// Reusable helpers for the app shell, top bar, nav, and campaign cards.

export function renderTopBar({ title = 'Xspresso', subtitle = 'Done-for-you marketing' } = {}) {
  return `
    <header class="xspresso-topbar">
      <div class="xspresso-brand">
        <img class="xspresso-logo-cup" src="/assets/Xspresso_cup.gif" alt="Xspresso" />
        <img class="xspresso-logo-wordmark" src="/assets/Xspresso_logo_txt.gif" alt="Xspresso" />
      </div>
      <div class="xspresso-topbar-copy">
        <div class="xspresso-title">${title}</div>
        <div class="xspresso-subtitle">${subtitle}</div>
      </div>
    </header>
  `;
}

export function renderNav(items = []) {
  const links = items.map(item => `<a class="xspresso-nav-link" href="${item.href}">${item.label}</a>`).join('');
  return `<nav class="xspresso-nav">${links}</nav>`;
}

export function renderCampaignCard(campaign = {}) {
  const status = campaign.status || 'draft';
  return `
    <article class="xspresso-card">
      <div class="xspresso-card-header">
        <h3>${campaign.name || 'Untitled Campaign'}</h3>
        <span class="xspresso-badge xspresso-badge--${status}">${status}</span>
      </div>
      <ul class="xspresso-stats">
        <li><strong>Platform:</strong> ${campaign.platform || 'Multiple'}</li>
        <li><strong>CPC:</strong> ${campaign.cpc ?? '—'}</li>
        <li><strong>CTR:</strong> ${campaign.ctr ?? '—'}</li>
        <li><strong>Conversions:</strong> ${campaign.conversions ?? 0}</li>
      </ul>
    </article>
  `;
}

export function renderPrimaryButton(label = 'Try the Demo', href = '#demo') {
  return `<a class="xspresso-button xspresso-button--primary" href="${href}">${label}</a>`;
}

export function renderSecondaryButton(label = 'See Pricing', href = '#pricing') {
  return `<a class="xspresso-button xspresso-button--secondary" href="${href}">${label}</a>`;
}
