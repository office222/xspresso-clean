// xspresso_813_main_app_bootstrap.js
// Main app bootstrap and simple state wiring for Xspresso.

export function createAppState() {
  return {
    user: null,
    plan: 'starter',
    credits: { included: 500, used: 0 },
    campaigns: [],
    notifications: [],
    templates: [],
    settings: {
      tone: 'simple',
      defaultGoal: 'sales',
      monitoringEnabled: true,
      alertThresholds: {
        cpcWarning: 1.5,
        cpcCritical: 2.0,
        ctrWarning: 0.8,
        ctrCritical: 0.5
      }
    }
  };
}

export function bootstrapApp() {
  const state = createAppState();
  return {
    state,
    initializedAt: new Date().toISOString(),
    ready: true
  };
}

export function updateCredits(state, used) {
  return {
    ...state,
    credits: {
      ...state.credits,
      used: (state.credits.used || 0) + used
    }
  };
}
