// Xspresso - Dashboard Router
// Purpose: route the user to the right dashboard view.

export const DashboardView = {
  OVERVIEW: 'overview',
  CAMPAIGNS: 'campaigns',
  ALERTS: 'alerts',
  CREDITS: 'credits',
  LEADS: 'leads',
  LIBRARY: 'library',
  SETTINGS: 'settings',
  HELP: 'help'
};

export function getDashboardRoute(view = DashboardView.OVERVIEW) {
  switch (view) {
    case DashboardView.CAMPAIGNS: return '/dashboard/campaigns';
    case DashboardView.ALERTS: return '/dashboard/alerts';
    case DashboardView.CREDITS: return '/dashboard/credits';
    case DashboardView.LEADS: return '/dashboard/leads';
    case DashboardView.LIBRARY: return '/dashboard/library';
    case DashboardView.SETTINGS: return '/dashboard/settings';
    case DashboardView.HELP: return '/dashboard/help';
    case DashboardView.OVERVIEW:
    default:
      return '/dashboard';
  }
}

export function isValidDashboardView(view) {
  return Object.values(DashboardView).includes(view);
}

export function defaultDashboardWidgets() {
  return ['campaignSummary', 'creditsRemaining', 'recentAlerts', 'activeMonitoring'];
}
