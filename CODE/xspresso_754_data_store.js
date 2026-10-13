// xspresso_754_data_store.js
export function createStore(initialState = {}) {
  let state = {
    route: 'dashboard',
    user: { name: 'Welcome back', creditsRemaining: 500 },
    campaigns: [],
    alerts: [],
    currentDraft: null,
    ...initialState
  };

  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(patch) {
    state = { ...state, ...patch };
    listeners.forEach(fn => fn(state));
    return state;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function addCampaign(campaign) {
    const campaigns = [...state.campaigns, campaign];
    return setState({ campaigns });
  }

  function addAlert(alert) {
    const alerts = [alert, ...state.alerts];
    return setState({ alerts });
  }

  return {
    getState,
    setState,
    subscribe,
    addCampaign,
    addAlert
  };
}
