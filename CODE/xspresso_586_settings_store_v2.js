// xspresso_586_settings_store_v2.js
// App settings and preferences store for Xspresso.

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
  credits: {
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
  },
};

export function getDefaultSettings() {
  return structuredClone(defaultSettings);
}

export function updateSettings(settings, updates) {
  return {
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
    credits: {
      ...(settings.credits || {}),
      ...(updates.credits || {}),
    },
    updatedAt: new Date().toISOString(),
  };
}

export function setTone(settings, tone) {
  return updateSettings(settings, { tone });
}

export function setMonitoringThresholds(settings, thresholds) {
  return updateSettings(settings, { alertThresholds: thresholds });
}
