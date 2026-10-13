// xspresso_846_ui_mount.js
import { bootstrap } from './xspresso_845_app_bootstrap.js';
import { getState, getDashboard, approveSection, regenerateSection, launchCampaign } from './xspresso_842_app.js';
import { buildDashboardModel, renderDashboardHTML } from './xspresso_833_dashboard_renderer.js';
import { reviewState, reviewSummary } from './xspresso_841_review_panel.js';
import { monitoringSweep } from './xspresso_840_monitoring_engine.js';
import { scoreLead } from './xspresso_844_lead_followup.js';

const state = bootstrap();

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function renderNav(root) {
  root.innerHTML = `
    <nav class="topbar">
      <div class="brand">
        <div class="cup">☕</div>
        <div>
          <strong>Xspresso</strong>
          <div class="muted">Done-for-you marketing</div>
        </div>
      </div>
      <div class="navlinks">
        <a href="#dashboard">Dashboard</a>
        <a href="#builder">Create Campaign</a>
        <a href="#monitoring">Monitoring</a>
        <a href="#leads">Leads</a>
        <a href="#help">Help</a>
      </div>
    </nav>
  `;
}

function renderDashboard(root) {
  const model = buildDashboardModel(getState());
  root.innerHTML = `
    <section class="hero-card">
      <h1>Wake up your marketing.</h1>
      <p>More responses. Less software chaos. You stay in command. We do the work.</p>
      <div class="hero-actions">
        <button data-action="goto-builder" class="primary">Try the Demo</button>
        <button data-action="goto-monitoring" class="secondary">See Monitoring</button>
      </div>
    </section>
    ${renderDashboardHTML(model)}
  `;
}

function renderBuilder(root) {
  const campaign = getState().campaigns[0];
  root.innerHTML = `
    <section class="panel">
      <h2>Campaign Builder</h2>
      <div class="grid-2">
        <label>Product name <input id="productName" value="${escapeHtml(campaign?.productName || '')}" /></label>
        <label>Audience <input id="audience" value="${escapeHtml(campaign?.audience || '')}" /></label>
        <label>Goal <select id="goal"><option value="sales">Sales</option><option value="leads">Leads</option><option value="clicks">Clicks</option></select></label>
        <label>Platform <select id="platform"><option value="general">General</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option></select></label>
      </div>
      <label>Offer description<textarea id="description" rows="5">${escapeHtml(campaign?.landingPage?.body || '')}</textarea></label>
      <div class="hero-actions">
        <button id="buildCampaign" class="primary">Generate Draft</button>
        <button id="loadDemo" class="secondary">Load Demo</button>
      </div>
      <pre id="builderOutput" class="codebox"></pre>
    </section>
  `;

  qs('#buildCampaign', root).addEventListener('click', () => {
    const brief = {
      name: 'Draft Campaign',
      productName: qs('#productName', root).value,
      audience: qs('#audience', root).value,
      goal: qs('#goal', root).value,
      platform: qs('#platform', root).value,
      landingPage: { headline: 'Done-for-you marketing that gets responses.', body: qs('#description', root).value }
    };
    const draft = buildDraftPreview(brief);
    qs('#builderOutput', root).textContent = JSON.stringify(draft, null, 2);
  });

  qs('#loadDemo', root).addEventListener('click', () => {
    state.campaign = bootstrap().campaign;
    routeTo('#dashboard');
  });
}

function buildDraftPreview(brief) {
  return {
    headline: `Wake up your marketing for ${brief.productName || 'your offer'}.`,
    subheadline: 'Done-for-you marketing that gets responses.',
    hooks: [
      'Turn one offer into a full campaign.',
      'You stay in command. We do the work.'
    ],
    landingPage: brief.landingPage,
    followUpEmails: [
      { day: 0, subject: 'Thanks for checking this out', body: 'Here is your first follow-up.' },
      { day: 2, subject: 'A quick reminder', body: 'A second pass may help.' }
    ]
  };
}

function renderMonitoring(root) {
  const stateSnapshot = getState();
  const sweep = monitoringSweep(stateSnapshot.campaigns.flatMap((c) => c.ads || []));
  root.innerHTML = `
    <section class="panel">
      <h2>Monitoring</h2>
      <p>Alerts: ${sweep.alerts.length}</p>
      <div class="alerts-list">
        ${sweep.alerts.map((a) => `<article class="alert ${a.level}"><strong>${escapeHtml(a.title)}</strong><p>${escapeHtml(a.message)}</p></article>`).join('') || '<p class="muted">No alerts right now.</p>'}
      </div>
    </section>
  `;
}

function renderLeads(root) {
  const lead = scoreLead({ name: 'Demo Lead', score: 10 }, 'opened_email');
  root.innerHTML = `
    <section class="panel">
      <h2>Leads</h2>
      <p>Lead score: ${lead.score}</p>
      <p>Status: ${lead.status}</p>
      <p class="muted">This view will grow into list management and follow-up automation.</p>
    </section>
  `;
}

function renderHelp(root) {
  root.innerHTML = `
    <section class="panel">
      <h2>Help</h2>
      <ul>
        <li>Add an offer to start a campaign.</li>
        <li>Approve or regenerate any section.</li>
        <li>Launch when the campaign is ready.</li>
        <li>Monitor performance and respond to alerts.</li>
      </ul>
    </section>
  `;
}

function routeTo(hash) {
  location.hash = hash;
}

function renderApp() {
  const navRoot = document.getElementById('app-nav');
  const mainRoot = document.getElementById('app-main');
  if (!navRoot || !mainRoot) return;
  renderNav(navRoot);

  const route = (location.hash || '#dashboard').replace('#', '');
  if (route === 'builder') renderBuilder(mainRoot);
  else if (route === 'monitoring') renderMonitoring(mainRoot);
  else if (route === 'leads') renderLeads(mainRoot);
  else if (route === 'help') renderHelp(mainRoot);
  else renderDashboard(mainRoot);

  qsa('button[data-action]', mainRoot).forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'goto-builder') routeTo('#builder');
      if (btn.dataset.action === 'goto-monitoring') routeTo('#monitoring');
    });
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

window.addEventListener('hashchange', renderApp);
window.addEventListener('DOMContentLoaded', renderApp);

export { renderApp, routeTo };
