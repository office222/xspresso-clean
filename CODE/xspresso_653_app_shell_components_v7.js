// xspresso_653_app_shell_components_v7.js
// Reusable shell helpers for Xspresso

export const APP_NAV_ITEMS = [
  'Dashboard',
  'Create Campaign',
  'Monitoring',
  'Leads',
  'Library',
  'Templates',
  'Credits',
  'Billing',
  'Settings',
  'Help'
];

export function buildTopBar({ userName = 'Welcome back', creditsRemaining = 0, alerts = 0 }) {
  return {
    title: userName,
    subtitle: creditsRemaining > 0 ? `${creditsRemaining} credits remaining` : 'No credits remaining',
    alerts,
    primaryAction: 'Create Campaign'
  };
}

export function buildNavState(active = 'Dashboard') {
  return APP_NAV_ITEMS.map(item => ({
    label: item,
    active: item === active,
    href: `#${item.toLowerCase().replace(/\s+/g, '-')}`
  }));
}

export function buildShellStatus({ alerts = 0, creditsRemaining = 0, monitoredAds = 0 }) {
  return {
    alertsLabel: alerts > 0 ? `${alerts} alerts` : 'All clear',
    creditsLabel: `${creditsRemaining} credits`,
    monitoredLabel: `${monitoredAds} monitored ads`
  };
}

export function shellCopy() {
  return {
    headline: 'Done-for-you marketing that gets responses.',
    subheadline: 'You stay in command. We do the work.',
    support: 'Wake up your marketing. Less chaos. More control.'
  };
}
