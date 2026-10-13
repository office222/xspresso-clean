// Xspresso app router
// File: xspresso_573_app_router_v2.js

export const routes = {
  dashboard: '/dashboard',
  createCampaign: '/campaigns/new',
  reviewCampaign: '/campaigns/review',
  launch: '/campaigns/launch',
  monitoring: '/monitoring',
  leads: '/leads',
  library: '/library',
  templates: '/templates',
  billing: '/billing',
  settings: '/settings',
  help: '/help',
};

export function getRouteAction(pathname = '') {
  const match = Object.entries(routes).find(([, route]) => route === pathname);
  return match ? match[0] : 'dashboard';
}

export function buildNavigationItems() {
  return [
    { label: 'Dashboard', route: routes.dashboard },
    { label: 'Create Campaign', route: routes.createCampaign },
    { label: 'Monitoring', route: routes.monitoring },
    { label: 'Leads', route: routes.leads },
    { label: 'Library', route: routes.library },
    { label: 'Templates', route: routes.templates },
    { label: 'Billing', route: routes.billing },
    { label: 'Settings', route: routes.settings },
    { label: 'Help', route: routes.help },
  ];
}