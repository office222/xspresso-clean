export function buildTopBar({ title = 'Xspresso', subtitle = 'Done-for-you marketing' } = {}) {
  return {
    title,
    subtitle,
    actions: ['Try the Demo', 'See Pricing']
  };
}

export function buildNavigationMenu() {
  return [
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
}

export function buildAppShell({ userName = 'Welcome back', activeRoute = 'Dashboard' } = {}) {
  return {
    topBar: buildTopBar(),
    navigation: buildNavigationMenu(),
    activeRoute,
    userName,
    primaryAction: 'Create Campaign'
  };
}

export function buildFooterLinks() {
  return ['Help Center', 'Billing Help', 'Monitoring Help', 'Platform Switch Help'];
}
