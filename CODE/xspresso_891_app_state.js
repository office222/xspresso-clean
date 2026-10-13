export const defaultAppState = {
  user: {
    name: '',
    plan: 'starter',
    creditsIncluded: 0,
    creditsUsed: 0,
  },
  campaigns: [],
  templates: [],
  leads: [],
  alerts: [],
  notifications: [],
  settings: {
    tone: 'simple',
    defaultGoal: 'sales',
    defaultPlatform: 'general',
    monitoringEnabled: true,
  },
};

export function createAppState(initialState = {}) {
  return {
    ...structuredClone(defaultAppState),
    ...structuredClone(initialState),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateAppState(state, patch = {}) {
  return {
    ...structuredClone(state || defaultAppState),
    ...structuredClone(patch),
    updatedAt: new Date().toISOString(),
  };
}

export function addCampaign(state, campaign) {
  const next = structuredClone(state || defaultAppState);
  next.campaigns = next.campaigns || [];
  next.campaigns.push({
    id: campaign.id || `cmp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...campaign,
  });
  next.updatedAt = new Date().toISOString();
  return next;
}

export function addAlert(state, alert) {
  const next = structuredClone(state || defaultAppState);
  next.alerts = next.alerts || [];
  next.alerts.unshift({
    id: alert.id || `alt_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'open',
    ...alert,
  });
  next.updatedAt = new Date().toISOString();
  return next;
}

export function addNotification(state, notification) {
  const next = structuredClone(state || defaultAppState);
  next.notifications = next.notifications || [];
  next.notifications.unshift({
    id: notification.id || `ntf_${Date.now()}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...notification,
  });
  next.updatedAt = new Date().toISOString();
  return next;
}
