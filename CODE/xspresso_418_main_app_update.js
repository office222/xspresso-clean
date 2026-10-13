// xspresso_418_main_app_update.js
// Main application wiring helpers for Xspresso V1

import { buildDashboardOverview } from './xspresso_412_dashboard_detail_views.js';
import { buildLaunchState } from './xspresso_415_launch_screen.js';
import { evaluatePerformanceAlert, mapAlertsToFeed } from './xspresso_413_alerts_notifications.js';

export function buildAppState({ user = {}, campaigns = [], alerts = [], activities = [] }) {
  const dashboard = buildDashboardOverview(user, campaigns, alerts);

  return {
    user,
    dashboard,
    launch: campaigns.length ? buildLaunchState(campaigns[0]) : buildLaunchState({}),
    alerts: mapAlertsToFeed(alerts),
    activities,
    evaluatedAlerts: campaigns.flatMap((campaign) => evaluatePerformanceAlert(campaign)),
  };
}

export function getPrimaryAction(route = 'dashboard') {
  switch (route) {
    case 'dashboard':
      return 'Create Campaign';
    case 'builder':
      return 'Generate Draft';
    case 'review':
      return 'Approve and Launch';
    case 'monitoring':
      return 'Fix Underperforming Ad';
    case 'billing':
      return 'Add Credits';
    default:
      return 'Continue';
  }
}

export function getRouteLabels() {
  return {
    dashboard: 'Dashboard',
    builder: 'Create Campaign',
    monitoring: 'Monitoring',
    leads: 'Leads',
    library: 'Library',
    templates: 'Templates',
    credits: 'Credits',
    billing: 'Billing',
    settings: 'Settings',
    help: 'Help',
  };
}

export function buildUiMessage() {
  return 'Xspresso keeps the work organized so you can stay in command.';
}

export default {
  buildAppState,
  getPrimaryAction,
  getRouteLabels,
  buildUiMessage,
};
