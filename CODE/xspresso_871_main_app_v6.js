import { createDashboardCards } from './xspresso_868_dashboard_cards_v14.js';
import { createHelpCenterPanel, helpCenterTopics } from './xspresso_865_help_center_panel_v2.js';
import { loadSettings } from './xspresso_866_settings_store_v8.js';
import { logActivity, loadActivityLog } from './xspresso_867_activity_log_v2.js';

const state = {
  activeCampaigns: 3,
  drafts: 2,
  alerts: 1,
  creditsRemaining: 1280,
  settings: loadSettings()
};

function renderHome(view) {
  view.innerHTML = '<h1 style="padding:20px 20px 0">Welcome to Xspresso</h1>';
  view.appendChild(createDashboardCards(state));
  const help = createHelpCenterPanel({ topics: helpCenterTopics });
  view.appendChild(help);
}

function boot() {
  const view = document.getElementById('view');
  renderHome(view);
  logActivity({ type: 'boot', title: 'App booted', message: 'Xspresso app loaded.' });
  console.log('Activity log size:', loadActivityLog().length);
}

window.addEventListener('DOMContentLoaded', boot);
