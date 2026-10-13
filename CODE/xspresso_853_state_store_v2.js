const defaultState = {
  user: {
    name: 'Guest',
    plan: 'starter',
    creditsIncluded: 500,
    creditsUsed: 0,
    creditsRemaining: 500
  },
  campaigns: [],
  notifications: [],
  templates: [],
  settings: {
    tone: 'simple',
    goal: 'sales',
    monitoringThresholds: {
      cpcWarning: 1.5,
      cpcCritical: 2.0,
      ctrWarning: 0.8,
      ctrCritical: 0.5
    }
  }
};

export function createState(initial = {}) {
  return {
    ...structuredClone(defaultState),
    ...structuredClone(initial),
    settings: {
      ...structuredClone(defaultState.settings),
      ...(initial.settings || {})
    }
  };
}

export function getCreditsRemaining(state) {
  const included = state?.user?.creditsIncluded ?? 0;
  const used = state?.user?.creditsUsed ?? 0;
  return Math.max(included - used, 0);
}

export function applyUsage(state, credits) {
  const next = structuredClone(state);
  next.user.creditsUsed = (next.user.creditsUsed || 0) + credits;
  next.user.creditsRemaining = getCreditsRemaining(next);
  return next;
}

export function addCampaign(state, campaign) {
  const next = structuredClone(state);
  next.campaigns.push({
    id: campaign.id || `cmp_${Date.now()}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    ...campaign
  });
  return next;
}

export function addNotification(state, notification) {
  const next = structuredClone(state);
  next.notifications.unshift({
    id: notification.id || `note_${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...notification
  });
  return next;
}

export function saveTemplate(state, template) {
  const next = structuredClone(state);
  next.templates.unshift({
    id: template.id || `tpl_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...template
  });
  return next;
}

export function updateSettings(state, partial) {
  const next = structuredClone(state);
  next.settings = {
    ...next.settings,
    ...partial,
    monitoringThresholds: {
      ...next.settings.monitoringThresholds,
      ...(partial.monitoringThresholds || {})
    }
  };
  return next;
}
