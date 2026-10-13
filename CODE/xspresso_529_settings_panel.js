// xspresso_529_settings_panel.js
// Settings helpers for Xspresso V1

export const defaultSettings = {
  tone: "simple",
  defaultGoal: "sales",
  defaultPlatform: "general",
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

export function updateSettings(settings, updates) {
  return {
    ...settings,
    ...updates,
    alertThresholds: {
      ...settings.alertThresholds,
      ...(updates.alertThresholds || {}),
    },
    platformDefaults: {
      ...settings.platformDefaults,
      ...(updates.platformDefaults || {}),
    },
    updatedAt: new Date().toISOString(),
  };
}

export function setTone(settings, tone) {
  return updateSettings(settings, { tone });
}
