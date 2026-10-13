// Xspresso app router v3
// Simple hash-based router for the shell app.

export const routes = {
  '#/dashboard': 'dashboard',
  '#/builder': 'builder',
  '#/monitoring': 'monitoring',
  '#/leads': 'leads',
  '#/library': 'library',
  '#/templates': 'templates',
  '#/billing': 'billing',
  '#/settings': 'settings',
  '#/help': 'help'
};

export function getRouteFromHash(hash = window.location.hash || '#/dashboard') {
  return routes[hash] || 'dashboard';
}

export function navigateTo(route) {
  const hash = route.startsWith('#') ? route : `#/${route}`;
  if (window.location.hash !== hash) window.location.hash = hash;
  return getRouteFromHash(hash);
}

export function initRouter(onRouteChange) {
  function handleChange() {
    onRouteChange(getRouteFromHash());
  }
  window.addEventListener('hashchange', handleChange);
  handleChange();
  return () => window.removeEventListener('hashchange', handleChange);
}
