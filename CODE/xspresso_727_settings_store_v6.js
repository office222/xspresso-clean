const defaultSettings = {
  tone: 'simple',
  defaultGoal: 'sales',
  defaultPlatform: 'general',
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

export function createSettings(overrides = {}) {
  return {
    ...defaultSettings,
    ...overrides,
    alertThresholds: {
      ...defaultSettings.alertThresholds,
      ...(overrides.alertThresholds || {}),
    },
    platformDefaults: {
      ...defaultSettings.platformDefaults,
      ...(overrides.platformDefaults || {}),
    },
    updatedAt: new Date().toISOString(),
  };
}

export function updateSettings(settings, updates = {}) {
  return createSettings({
    ...settings,
    ...updates,
    alertThresholds: {
      ...(settings.alertThresholds || {}),
      ...(updates.alertThresholds || {}),
    },
    platformDefaults: {
      ...(settings.platformDefaults || {}),
      ...(updates.platformDefaults || {}),
    },
  });
}

export function resetSettings() {
  return createSettings();
}

export function shouldWarnOnCpc(settings, cpc) {
  return cpc >= (settings.alertThresholds?.cpcWarning ?? defaultSettings.alertThresholds.cpcWarning);
}

export function shouldTriggerCpcCritical(settings, cpc) {
  return cpc >= (settings.alertThresholds?.cpcCritical ?? defaultSettings.alertThresholds.cpcCritical);
}
