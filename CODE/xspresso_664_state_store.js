// xspresso_664_state_store.js
// Central app state store for Xspresso

const AppState = {
  user: {
    name: 'User',
    plan: 'starter',
    creditsIncluded: 500,
    creditsUsed: 0,
    creditsRemaining: 500,
    billingCycle: 'monthly'
  },
  campaigns: [],
  alerts: [],
  activities: [],
  templates: [],
  settings: {
    tone: 'simple',
    defaultGoal: 'sales',
    defaultPlatform: 'general',
    monitoringEnabled: true,
    cpcWarning: 1.5,
    cpcCritical: 2.0,
    ctrWarning: 0.8,
    ctrCritical: 0.5
  }
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getState() {
  return clone(AppState);
}

function setState(patch) {
  Object.assign(AppState, patch);
  return getState();
}

function updateUserCredits(creditsUsed) {
  AppState.user.creditsUsed += creditsUsed;
  AppState.user.creditsRemaining = Math.max(
    AppState.user.creditsIncluded - AppState.user.creditsUsed,
    0
  );
  return getState();
}

function addCampaign(campaign) {
  AppState.campaigns.unshift(campaign);
  return getState();
}

function updateCampaign(id, patch) {
  AppState.campaigns = AppState.campaigns.map(c =>
    c.id === id ? { ...c, ...patch } : c
  );
  return getState();
}

function addAlert(alert) {
  AppState.alerts.unshift(alert);
  return getState();
}

function addActivity(activity) {
  AppState.activities.unshift(activity);
  return getState();
}

function addTemplate(template) {
  AppState.templates.unshift(template);
  return getState();
}

function resetState() {
  AppState.user = {
    name: 'User',
    plan: 'starter',
    creditsIncluded: 500,
    creditsUsed: 0,
    creditsRemaining: 500,
    billingCycle: 'monthly'
  };
  AppState.campaigns = [];
  AppState.alerts = [];
  AppState.activities = [];
  AppState.templates = [];
  return getState();
}

module.exports = {
  AppState,
  getState,
  setState,
  updateUserCredits,
  addCampaign,
  updateCampaign,
  addAlert,
  addActivity,
  addTemplate,
  resetState
};