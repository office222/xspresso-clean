// xspresso_749_main_app.js
// Main wiring for the Xspresso app.

import { createStore } from './xspresso_753_data_store.js';
import { renderDashboard } from './xspresso_751_dashboard_view.js';
import { renderCampaignWorkflow } from './xspresso_752_campaign_workflow.js';
import { renderMonitoringView } from './xspresso_753_monitoring_view.js';

const store = createStore({
  user: {
    name: 'Welcome back',
    plan: 'Starter',
    creditsRemaining: 500
  },
  campaigns: [],
  alerts: [],
  route: 'dashboard'
});

function mountApp(root) {
  if (!root) throw new Error('Xspresso root element not found.');

  const state = store.getState();
  let html = '';

  switch (state.route) {
    case 'campaign':
      html = renderCampaignWorkflow(state, store);
      break;
    case 'monitoring':
      html = renderMonitoringView(state, store);
      break;
    case 'dashboard':
    default:
      html = renderDashboard(state, store);
      break;
  }

  root.innerHTML = html;
}

function bootstrap() {
  const root = document.getElementById('app');
  if (!root) return;
  mountApp(root);

  window.xspresso = {
    store,
    mountApp,
    go(route) {
      store.setState({ route });
      mountApp(root);
    }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
