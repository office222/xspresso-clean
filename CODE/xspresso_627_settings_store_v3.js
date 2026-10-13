// xspresso_627_settings_store_v3.js

export const defaultSettings = {
  tone: 'simple',
  goal: 'sales',
  platform: 'general',
  monitoringEnabled: true,
  alertThresholds: {
    cpcWarning: 1.5,
    cpcCritical: 2.0,
    ctrWarning: 0.8,
    ctrCritical: 0.5,
  },
  platformDefaults: {
    keepMonitoringOnSwitch: false,
    rushSwitchEnabled: true,
  },
};

export function createSettingsStore(initial = {}) {
  let state = { ...defaultSettings, ...initial };

  return {
    get() {
      return { ...state };
    },
    update(updates = {}) {
      state = {
        ...state,
        ...updates,
        alertThresholds: {
          ...state.alertThresholds,
          ...(updates.alertThresholds || {}),
        },
        platformDefaults: {
          ...state.platformDefaults,
          ...(updates.platformDefaults || {}),
        },
        updatedAt: new Date().toISOString(),
      };
      return this.get();
    },
    reset() {
      state = { ...defaultSettings };
      return this.get();
    },
  };
}
