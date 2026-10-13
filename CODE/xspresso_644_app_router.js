import { buildDashboardCards, buildCampaignCard } from './xspresso_641_dashboard_cards.js';
import { pushNotification, buildNotificationsHtml } from './xspresso_642_notifications_center.js';
import { searchHelpTopics, renderHelpTopics } from './xspresso_643_help_center_data.js';

const appState = {
  activeCampaigns: 3,
  drafts: 2,
  alerts: 1,
  creditsRemaining: 420,
  campaigns: [
    { id: 'cmp_1', name: 'Jones Street Pub', status: 'live', platform: 'TikTok', cpc: 1.42, ctr: '0.8%', conversions: 2 },
    { id: 'cmp_2', name: 'Light Touch Body Cream', status: 'needs_review', platform: 'Meta', cpc: 1.67, ctr: '0.6%', conversions: 0 }
  ]
};

function mountDashboard() {
  const dashboardMount = document.getElementById('dashboard-mount');
  if (!dashboardMount) return;

  const metrics = buildDashboardCards(appState);
  const campaigns = appState.campaigns.map(buildCampaignCard).join('');
  dashboardMount.innerHTML = `<div class="metrics-grid">${metrics}</div><div class="campaigns-grid">${campaigns}</div>`;
}

function mountAlerts() {
  const alertsMount = document.getElementById('alerts-mount');
  if (!alertsMount) return;

  if (!appState.alerts) {
    alertsMount.innerHTML = '';
    return;
  }

  pushNotification({
    title: 'CPC is rising',
    message: 'One campaign may need a tweak before more credits are used.',
    level: 'warning',
    action: 'regenerate'
  });

  alertsMount.innerHTML = buildNotificationsHtml();
}

function mountHelpPanel() {
  const topics = searchHelpTopics('');
  const helpPanel = document.getElementById('help-panel');
  if (!helpPanel) return;
  helpPanel.innerHTML = renderHelpTopics(topics);
}

function bindShellActions() {
  document.getElementById('btn-create')?.addEventListener('click', () => {
    window.location.hash = '#builder';
  });

  document.getElementById('hero-demo')?.addEventListener('click', () => {
    pushNotification({
      title: 'Demo requested',
      message: 'Show the user the campaign builder and launch flow.',
      level: 'info'
    });
    alert('Demo mode is ready.');
  });

  document.getElementById('hero-pricing')?.addEventListener('click', () => {
    window.location.hash = '#billing';
  });
}

function route() {
  const routeName = window.location.hash.replace('#', '') || 'dashboard';
  const main = document.getElementById('app-main');
  if (!main) return;

  if (routeName === 'help') {
    main.innerHTML = `<section class="help-layout"><h2>Help Center</h2><div id="help-panel"></div></section>`;
    mountHelpPanel();
    return;
  }

  if (routeName === 'builder') {
    main.innerHTML = `<section class="screen-placeholder"><h2>Campaign Builder</h2><p>Wire up the builder form here.</p></section>`;
    return;
  }

  if (routeName === 'monitoring') {
    main.innerHTML = `<section class="screen-placeholder"><h2>Monitoring</h2><p>Ad health and alerts appear here.</p></section>`;
    return;
  }

  main.innerHTML = `
    <section class="hero-card">
      <p class="eyebrow">Done-for-you marketing</p>
      <h1>Wake up your marketing.</h1>
      <p class="lead">Build campaigns, monitor performance, and follow up automatically while you stay in command.</p>
      <div class="cta-row">
        <button class="btn btn-primary" id="hero-demo">Try the Demo</button>
        <button class="btn btn-secondary" id="hero-pricing">See Pricing</button>
      </div>
    </section>
    <section id="dashboard-mount" class="dashboard-grid"></section>
    <section id="alerts-mount" class="alerts-panel"></section>
  `;

  mountDashboard();
  mountAlerts();
  bindShellActions();
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  bindShellActions();
  route();
});
