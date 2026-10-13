// xspresso_880_app_state.js
export const createInitialState = () => ({
  user: {
    id: null,
    name: 'Guest',
    plan: 'starter',
    credits: 0,
    creditsUsed: 0,
    creditsRemaining: 0,
    roles: ['viewer']
  },
  campaigns: [],
  alerts: [],
  notifications: [],
  templates: [],
  leads: [],
  settings: {
    tone: 'simple',
    defaultGoal: 'sales',
    monitoring: {
      cpcWarning: 1.5,
      cpcCritical: 2.0,
      ctrWarning: 0.8,
      ctrCritical: 0.5
    }
  },
  ui: {
    currentView: 'dashboard',
    selectedCampaignId: null,
    sidebarOpen: true,
    loading: false
  }
});

export function hydrateState(partial = {}) {
  const base = createInitialState();
  return {
    ...base,
    ...partial,
    user: { ...base.user, ...(partial.user || {}) },
    settings: { ...base.settings, ...(partial.settings || {}) },
    ui: { ...base.ui, ...(partial.ui || {}) }
  };
}

export function setCurrentView(state, view) {
  return { ...state, ui: { ...state.ui, currentView: view } };
}

export function setSelectedCampaign(state, campaignId) {
  return { ...state, ui: { ...state.ui, selectedCampaignId: campaignId } };
}

export function upsertCampaign(state, campaign) {
  const exists = state.campaigns.some(c => c.id === campaign.id);
  const campaigns = exists
    ? state.campaigns.map(c => (c.id === campaign.id ? { ...c, ...campaign } : c))
    : [...state.campaigns, campaign];

  return { ...state, campaigns };
}

export function appendAlert(state, alert) {
  return { ...state, alerts: [alert, ...state.alerts] };
}

export function appendNotification(state, notification) {
  return { ...state, notifications: [notification, ...state.notifications] };
}

export function updateCredits(state, creditsIncluded, creditsUsed = 0) {
  return {
    ...state,
    user: {
      ...state.user,
      credits: creditsIncluded,
      creditsUsed,
      creditsRemaining: Math.max(creditsIncluded - creditsUsed, 0)
    }
  };
}
