// xspresso_506_dashboard_router_v2.js
// Lightweight view router for the Xspresso dashboard.

export const Views = Object.freeze({
  DASHBOARD: 'dashboard',
  BUILDER: 'builder',
  REVIEW: 'review',
  LAUNCH: 'launch',
  MONITORING: 'monitoring',
  LEADS: 'leads',
  LIBRARY: 'library',
  TEMPLATES: 'templates',
  BILLING: 'billing',
  SETTINGS: 'settings',
  HELP: 'help'
});

export function getDefaultRoute() {
  return Views.DASHBOARD;
}

export function parseRoute(pathname) {
  const path = (pathname || '').replace(/^\//, '').toLowerCase();
  const match = Object.values(Views).find(v => v === path);
  return match || Views.DASHBOARD;
}

export function routeForCampaignStatus(status) {
  switch (status) {
    case 'draft': return Views.BUILDER;
    case 'ready': return Views.REVIEW;
    case 'live': return Views.MONITORING;
    case 'needs_attention': return Views.REVIEW;
    case 'paused': return Views.DASHBOARD;
    default: return Views.DASHBOARD;
  }
}

export function navItems() {
  return [
    { label: 'Dashboard', view: Views.DASHBOARD },
    { label: 'Create Campaign', view: Views.BUILDER },
    { label: 'Monitoring', view: Views.MONITORING },
    { label: 'Leads', view: Views.LEADS },
    { label: 'Library', view: Views.LIBRARY },
    { label: 'Templates', view: Views.TEMPLATES },
    { label: 'Credits', view: Views.BILLING },
    { label: 'Settings', view: Views.SETTINGS },
    { label: 'Help', view: Views.HELP }
  ];
}
