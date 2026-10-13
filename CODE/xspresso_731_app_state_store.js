// xspresso_731_app_state_store.js
// Central shared state store for the Xspresso app.

export const initialState = {
  user: {
    id: null,
    name: '',
    email: ''
  },
  plan: {
    name: 'starter',
    creditsIncluded: 500,
    creditsUsed: 0,
    renewalDate: null
  },
  campaigns: [],
  alerts: [],
  notifications: [],
  templates: [],
  library: [],
  settings: {
    tone: 'simple',
    defaultGoal: 'sales',
    defaultPlatform: 'general',
    monitoringEnabled: true
  },
  ui: {
    activeSection: 'dashboard',
    selectedCampaignId: null,
    selectedAdId: null
  }
};

let state = structuredClone(initialState);
const listeners = new Set();

export function getState() {
  return state;
}

export function setState(updater) {
  const nextState = typeof updater === 'function' ? updater(structuredClone(state)) : updater;
  state = { ...state, ...nextState };
  listeners.forEach((fn) => fn(getState()));
  return state;
}

export function resetState() {
  state = structuredClone(initialState);
  listeners.forEach((fn) => fn(getState()));
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

export function updateCredits(creditsUsedDelta) {
  return setState((current) => ({
    plan: {
      ...current.plan,
      creditsUsed: Math.max(0, (current.plan.creditsUsed || 0) + creditsUsedDelta)
    }
  }));
}

export function addCampaign(campaign) {
  return setState((current) => ({
    campaigns: [campaign, ...current.campaigns]
  }));
}

export function updateCampaign(campaignId, patch) {
  return setState((current) => ({
    campaigns: current.campaigns.map((campaign) =>
      campaign.id === campaignId ? { ...campaign, ...patch } : campaign
    )
  }));
}

export function addAlert(alert) {
  return setState((current) => ({
    alerts: [alert, ...current.alerts]
  }));
}

export function addNotification(notification) {
  return setState((current) => ({
    notifications: [notification, ...current.notifications]
  }));
}
