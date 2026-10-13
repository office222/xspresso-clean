// Xspresso - Dashboard Router v5
// Simple route resolution and dashboard view selection.

const DASHBOARD_ROUTES = {
  home: 'dashboard',
  dashboard: 'dashboard',
  create: 'campaign-builder',
  builder: 'campaign-builder',
  review: 'campaign-review',
  launch: 'launch',
  monitoring: 'monitoring',
  leads: 'leads',
  library: 'library',
  templates: 'templates',
  billing: 'billing',
  settings: 'settings',
  help: 'help'
};

function parseHash(hash = '') {
  const clean = hash.replace(/^#/, '').trim();
  if (!clean) return 'dashboard';
  const [route] = clean.split('?');
  return DASHBOARD_ROUTES[route] || route;
}

function resolveRoute(hash) {
  const view = parseHash(hash);
  return {
    view,
    isDashboard: view === 'dashboard',
    isBuilder: view === 'campaign-builder',
    isReview: view === 'campaign-review',
    isLaunch: view === 'launch',
    isMonitoring: view === 'monitoring'
  };
}

function routeLabel(view) {
  const labels = {
    dashboard: 'Dashboard',
    'campaign-builder': 'Campaign Builder',
    'campaign-review': 'Review Campaign',
    launch: 'Launch',
    monitoring: 'Monitoring',
    leads: 'Leads',
    library: 'Library',
    templates: 'Templates',
    billing: 'Billing',
    settings: 'Settings',
    help: 'Help'
  };
  return labels[view] || 'Dashboard';
}

function routeTo(hash, onNavigate) {
  const route = resolveRoute(hash);
  if (typeof onNavigate === 'function') onNavigate(route);
  return route;
}

module.exports = {
  DASHBOARD_ROUTES,
  parseHash,
  resolveRoute,
  routeLabel,
  routeTo
};
