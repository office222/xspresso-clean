import { createSettingsStore } from './xspresso_803_settings_store_v7.js';

export function bootstrapApp({ user = {}, campaigns = [], notifications = [] } = {}) {
  const settingsStore = createSettingsStore(user.settings || {});

  return {
    user: {
      name: user.name || 'Welcome back',
      plan: user.plan || 'starter',
      creditsRemaining: user.creditsRemaining || 0
    },
    campaigns,
    notifications,
    settings: settingsStore.get(),
    routes: ['dashboard', 'builder', 'monitoring', 'leads', 'library', 'templates', 'billing', 'settings', 'help']
  };
}

export function getAppSummary(appState = {}) {
  return {
    totalCampaigns: (appState.campaigns || []).length,
    unreadNotifications: (appState.notifications || []).filter(n => !n.read).length,
    creditsRemaining: appState.user?.creditsRemaining || 0
  };
}
