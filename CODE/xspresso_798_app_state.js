// xspresso_798_app_state.js
// Simple shared app state for Xspresso

export const appState = {
  user: null,
  campaigns: [],
  leads: [],
  templates: [],
  alerts: [],
  activities: [],
  subscription: {
    plan: 'starter',
    billingCycle: 'monthly',
    status: 'active',
    creditsIncluded: 500,
    creditsUsed: 0,
  },
  ui: {
    activeView: 'dashboard',
    selectedCampaignId: null,
    selectedLeadId: null,
    isSidebarOpen: true,
  },
};

export function setState(patch) {
  Object.assign(appState, patch);
  return appState;
}

export function updateCampaign(campaignId, patch) {
  appState.campaigns = appState.campaigns.map(c => c.id === campaignId ? { ...c, ...patch } : c);
  return appState.campaigns;
}

export function addActivity(activity) {
  appState.activities.unshift(activity);
  return appState.activities;
}

export function addAlert(alert) {
  appState.alerts.unshift(alert);
  return appState.alerts;
}
