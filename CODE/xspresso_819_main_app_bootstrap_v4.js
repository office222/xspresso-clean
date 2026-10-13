// xspresso_819_main_app_bootstrap_v4.js
// Main app bootstrap for Xspresso

export function bootstrapApp({ mountId = "app", initialState = {} } = {}) {
  const app = {
    state: {
      user: null,
      campaigns: [],
      alerts: [],
      leads: [],
      credits: 0,
      ...initialState,
    },
    mountId,
  };

  if (typeof window !== "undefined") {
    window.__XSPRESSO__ = window.__XSPRESSO__ || {};
    window.__XSPRESSO__.app = app;
  }

  return app;
}

export function hydrateApp(app, snapshot = {}) {
  app.state = { ...app.state, ...snapshot };
  return app;
}

export function resetApp(app) {
  app.state = {
    user: null,
    campaigns: [],
    alerts: [],
    leads: [],
    credits: 0,
  };
  return app;
}
