// xspresso_737_app_router_v2.js
// Simple app router for Xspresso

export const ROUTES = {
  dashboard: 'dashboard',
  create: 'create',
  review: 'review',
  launch: 'launch',
  monitor: 'monitor',
  leads: 'leads',
  library: 'library',
  templates: 'templates',
  credits: 'credits',
  billing: 'billing',
  settings: 'settings',
  help: 'help'
};

export function getRouteFromHash(hash = window.location.hash) {
  const value = String(hash || '').replace('#', '').trim();
  return ROUTES[value] ? value : 'dashboard';
}

export function navigate(route) {
  if (!ROUTES[route]) return ROUTES.dashboard;
  window.location.hash = `#${route}`;
  return route;
}

export function renderRoute(route, renderers = {}) {
  const active = ROUTES[route] ? route : 'dashboard';
  const fn = renderers[active] || renderers.dashboard;
  if (typeof fn === 'function') fn();
  return active;
}

export function setupDefaultRoute(renderers = {}) {
  const route = getRouteFromHash();
  renderRoute(route, renderers);
  window.addEventListener('hashchange', () => renderRoute(getRouteFromHash(), renderers));
}
