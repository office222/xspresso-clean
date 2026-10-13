// xspresso_669_navigation_menu.js
// Navigation menu helpers for the Xspresso app shell.

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '#dashboard' },
  { id: 'create', label: 'Create Campaign', href: '#create' },
  { id: 'monitoring', label: 'Monitoring', href: '#monitoring' },
  { id: 'leads', label: 'Leads', href: '#leads' },
  { id: 'library', label: 'Library', href: '#library' },
  { id: 'templates', label: 'Templates', href: '#templates' },
  { id: 'credits', label: 'Credits', href: '#credits' },
  { id: 'billing', label: 'Billing', href: '#billing' },
  { id: 'settings', label: 'Settings', href: '#settings' },
  { id: 'help', label: 'Help', href: '#help' }
];

export function buildNav(activeId = 'dashboard') {
  return NAV_ITEMS.map(item => ({
    ...item,
    active: item.id === activeId
  }));
}

export function getPrimaryActionForRoute(routeId) {
  switch (routeId) {
    case 'dashboard': return 'Create Campaign';
    case 'create': return 'Generate Draft';
    case 'monitoring': return 'Review Alerts';
    case 'leads': return 'Open Lead List';
    case 'library': return 'Save to Library';
    case 'templates': return 'Use Template';
    case 'billing': return 'Review Plan';
    default: return 'Continue';
  }
}
