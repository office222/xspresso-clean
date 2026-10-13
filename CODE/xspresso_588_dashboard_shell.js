// xspresso_588_dashboard_shell.js
// Dashboard shell helpers for Xspresso.

export function buildDashboardShell(state = {}) {
  return {
    userName: state.userName || 'Welcome back',
    creditsRemaining: state.creditsRemaining ?? 0,
    activeCampaigns: state.activeCampaigns ?? 0,
    alerts: state.alerts ?? 0,
    monitoredAds: state.monitoredAds ?? 0,
    recentActivity: state.recentActivity || [],
    campaigns: state.campaigns || []
  };
}

export function dashboardSummaryText(shell) {
  return `${shell.activeCampaigns} active campaigns, ${shell.alerts} alerts, ${shell.creditsRemaining} credits left.`;
}

export function getDashboardActions() {
  return [
    'Create Campaign',
    'Review Draft',
    'Launch Now',
    'Monitor Ads',
    'Add Credits'
  ];
}