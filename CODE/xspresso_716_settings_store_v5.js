const DEFAULT_SETTINGS = {
  tone: 'simple',
  defaultGoal: 'sales',
  defaultPlatform: 'general',
  monitoringEnabled: true,
  alertThresholds: {
    cpcWarning: 1.5,
    cpcCritical: 2.0,
    ctrWarning: 0.8,
    ctrCritical: 0.5
  },
  platformDefaults: {
    keepMonitoringOnSwitch: false,
    rushSwitchEnabled: true
  }
};

export function createSettingsStore(overrides = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...overrides,
    alertThresholds: { ...DEFAULT_SETTINGS.alertThresholds, ...(overrides.alertThresholds || {}) },
    platformDefaults: { ...DEFAULT_SETTINGS.platformDefaults, ...(overrides.platformDefaults || {}) }
  };
}

export function updateSettings(settings = DEFAULT_SETTINGS, updates = {}) {
  return createSettingsStore({ ...settings, ...updates });
}

export function resetSettings() {
  return createSettingsStore();
}
