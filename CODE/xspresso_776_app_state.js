window.XspressoState = (() => {
  const state = {
    user: { name: 'Welcome back', plan: 'Starter', credits: 500 },
    campaigns: [],
    alerts: [],
    activity: [],
    settings: {
      tone: 'simple',
      monitoring: true,
      cpcWarning: 1.5,
      cpcCritical: 2.0
    }
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));

  return {
    get() {
      return clone(state);
    },
    set(partial) {
      Object.assign(state, partial);
      return clone(state);
    },
    updateUser(partial) {
      Object.assign(state.user, partial);
      return clone(state.user);
    },
    addCampaign(campaign) {
      state.campaigns.unshift(campaign);
      return clone(state.campaigns);
    },
    addAlert(alert) {
      state.alerts.unshift(alert);
      return clone(state.alerts);
    },
    logActivity(entry) {
      state.activity.unshift({ ...entry, createdAt: new Date().toISOString() });
      return clone(state.activity);
    }
  };
})();
