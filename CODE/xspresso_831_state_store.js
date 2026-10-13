// xspresso_831_state_store.js
export function createStateStore(initialState = {}) {
  let state = {
    user: null,
    campaigns: [],
    alerts: [],
    notifications: [],
    templates: [],
    leads: [],
    credits: { included: 0, used: 0, remaining: 0 },
    settings: {
      tone: "simple",
      monitoringEnabled: true,
      platformDefaults: []
    },
    ...initialState
  };

  const listeners = new Set();

  function getState() {
    return structuredClone(state);
  }

  function setState(patch) {
    const next = typeof patch === "function" ? patch(getState()) : patch;
    state = { ...state, ...next };
    listeners.forEach((listener) => listener(getState()));
    return getState();
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
  }

  function reset(newState = {}) {
    state = {
      user: null,
      campaigns: [],
      alerts: [],
      notifications: [],
      templates: [],
      leads: [],
      credits: { included: 0, used: 0, remaining: 0 },
      settings: {
        tone: "simple",
        monitoringEnabled: true,
        platformDefaults: []
      },
      ...newState
    };
    listeners.forEach((listener) => listener(getState()));
    return getState();
  }

  return { getState, setState, subscribe, reset };
}

export function normalizeCredits(credits = {}) {
  const included = Number(credits.included || 0);
  const used = Number(credits.used || 0);
  return {
    included,
    used,
    remaining: Math.max(included - used, 0)
  };
}
