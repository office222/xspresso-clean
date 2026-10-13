// xspresso_487_settings_store.js
// User preferences and defaults for Xspresso V1

export const defaultSettings = {
  tone: "simple",
  defaultGoal: "sales",
  defaultPlatform: "general",
  monitoringEnabled: true,
  keepMonitoringOnPlatformSwitch: false,
  alertThresholds: {
    cpcWarning: 1.5,
    cpcCritical: 2.0,
    ctrWarning: 0.8,
    ctrCritical: 0.5,
  },
  credits: {
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
  },
};

export function loadSettings(storedSettings = {}) {
  return {
    ...defaultSettings,
    ...storedSettings,
    alertThresholds: {
      ...defaultSettings.alertThresholds,
      ...(storedSettings.alertThresholds || {}),
    },
    credits: {
      ...defaultSettings.credits,
      ...(storedSettings.credits || {}),
    },
  };
}

export function updateSettings(currentSettings = {}, updates = {}) {
  return loadSettings({
    ...currentSettings,
    ...updates,
  });
}

export function setTone(settings = {}, tone = "simple") {
  return updateSettings(settings, { tone });
}

export function setMonitoringEnabled(settings = {}, enabled = true) {
  return updateSettings(settings, { monitoringEnabled: Boolean(enabled) });
}
