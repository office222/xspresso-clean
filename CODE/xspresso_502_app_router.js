export const Routes = {
  dashboard: '/dashboard',
  builder: '/builder',
  review: '/review',
  launch: '/launch',
  monitoring: '/monitoring',
  leads: '/leads',
  library: '/library',
  templates: '/templates',
  credits: '/credits',
  billing: '/billing',
  settings: '/settings',
  help: '/help'
};

export function getDefaultRoute() {
  return Routes.dashboard;
}

export function isProtectedRoute(path) {
  return Object.values(Routes).includes(path);
}

export function getRouteLabel(path) {
  const labels = {
    '/dashboard': 'Dashboard',
    '/builder': 'Create Campaign',
    '/review': 'Review',
    '/launch': 'Launch',
    '/monitoring': 'Monitoring',
    '/leads': 'Leads',
    '/library': 'Library',
    '/templates': 'Templates',
    '/credits': 'Credits',
    '/billing': 'Billing',
    '/settings': 'Settings',
    '/help': 'Help'
  };

  return labels[path] || 'Xspresso';
}
