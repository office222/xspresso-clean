// xspresso_593_app_router.js
// Simple application routing helpers.

export const routes = {
  dashboard: '/',
  campaignBuilder: '/campaign-builder',
  review: '/review',
  launch: '/launch',
  monitoring: '/monitoring',
  leads: '/leads',
  library: '/library',
  templates: '/templates',
  billing: '/billing',
  settings: '/settings',
  help: '/help'
};

export function getRouteLabel(path) {
  const entry = Object.entries(routes).find(([, value]) => value === path);
  return entry ? entry[0] : 'unknown';
}

export function defaultRoute() {
  return routes.dashboard;
}