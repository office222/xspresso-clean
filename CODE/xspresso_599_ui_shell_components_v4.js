// Xspresso UI shell components v4
export function topBar({ logoLeft = true, title = 'Xspresso', cta = 'Try the Demo' } = {}) {
  return { logoLeft, title, cta };
}

export function navItems() {
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

export function shellLayout() {
  return {
    topBar: true,
    leftNav: true,
    mainContent: true,
    rightPanel: true,
    footer: true
  };
}
