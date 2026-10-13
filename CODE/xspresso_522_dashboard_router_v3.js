export const DashboardRoute = Object.freeze({
  HOME: '/',
  CAMPAIGNS: '/campaigns',
  BUILDER: '/builder',
  MONITORING: '/monitoring',
  LEADS: '/leads',
  LIBRARY: '/library',
  TEMPLATES: '/templates',
  CREDITS: '/credits',
  BILLING: '/billing',
  SETTINGS: '/settings',
  HELP: '/help'
});

export function getPrimaryDashboardAction(view = DashboardRoute.HOME) {
  switch (view) {
    case DashboardRoute.HOME:
      return 'Create Campaign';
    case DashboardRoute.CAMPAIGNS:
      return 'Review Draft';
    case DashboardRoute.BUILDER:
      return 'Generate Draft';
    case DashboardRoute.MONITORING:
      return 'Fix Underperforming Ad';
    case DashboardRoute.LEADS:
      return 'Review Follow-Up';
    case DashboardRoute.LIBRARY:
      return 'Reuse Saved Work';
    case DashboardRoute.TEMPLATES:
      return 'Start From Template';
    case DashboardRoute.CREDITS:
      return 'Add Credits';
    case DashboardRoute.BILLING:
      return 'Manage Billing';
    case DashboardRoute.SETTINGS:
      return 'Save Settings';
    case DashboardRoute.HELP:
      return 'Find Help';
    default:
      return 'Continue';
  }
}

export function getDashboardSummary(user, campaigns = [], notifications = []) {
  return {
    userName: user?.name || 'Welcome back',
    activeCampaigns: campaigns.filter(c => c.status === 'live').length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    alerts: notifications.filter(n => !n.read).length,
    creditsRemaining: user?.creditsRemaining ?? 0,
    monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0)
  };
}

export function getStatusBadge(status) {
  switch (status) {
    case 'live': return { label: 'Live', color: 'green' };
    case 'draft': return { label: 'Draft', color: 'gray' };
    case 'underperforming': return { label: 'Needs Attention', color: 'red' };
    case 'paused': return { label: 'Paused', color: 'blue' };
    default: return { label: 'Unknown', color: 'gray' };
  }
}
