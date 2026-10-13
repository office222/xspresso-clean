// xspresso_620_app_shell_components_v6.js
// App shell / navigation / layout helpers for Xspresso

export const navItems = [
  'Dashboard',
  'Create Campaign',
  'Monitoring',
  'Leads',
  'Library',
  'Templates',
  'Credits',
  'Billing',
  'Settings',
  'Help',
];

export function buildAppShell({ title = 'Xspresso', userName = 'Welcome back' } = {}) {
  return {
    title,
    userName,
    navItems,
    primaryAction: 'Create Campaign',
    secondaryAction: 'See Pricing',
    statusStrip: 'You stay in command. We do the work.',
  };
}

export function buildShellHeader() {
  return {
    logoLeft: true,
    whiteBackground: true,
    keepInline: true,
    responsiveShrink: true,
  };
}

export function buildFooterLinks() {
  return ['Help Center', 'Billing Help', 'Monitoring Help', 'Platform Switch Help'];
}
