// xspresso_444_navigation_menu.js
// Xspresso navigation menu and top bar helpers.

export const navigationMenu = [
  { label: 'Dashboard', key: 'dashboard' },
  { label: 'Create Campaign', key: 'create-campaign' },
  { label: 'Monitoring', key: 'monitoring' },
  { label: 'Leads', key: 'leads' },
  { label: 'Library', key: 'library' },
  { label: 'Templates', key: 'templates' },
  { label: 'Credits', key: 'credits' },
  { label: 'Billing', key: 'billing' },
  { label: 'Settings', key: 'settings' },
  { label: 'Help', key: 'help' },
];

export function getPrimaryAction(route = 'dashboard') {
  switch (route) {
    case 'dashboard':
      return 'Create Campaign';
    case 'create-campaign':
      return 'Generate Draft';
    case 'monitoring':
      return 'Review Alerts';
    case 'library':
      return 'Save as Template';
    case 'templates':
      return 'Use Template';
    case 'billing':
      return 'Add Credits';
    default:
      return 'Continue';
  }
}

export function buildTopBarState({ userName = 'Welcome back', creditsRemaining = 0, alerts = 0 } = {}) {
  return {
    userName,
    creditsRemaining,
    alerts,
    statusText: creditsRemaining <= 0 ? 'Out of credits' : `${creditsRemaining} credits remaining`,
  };
}