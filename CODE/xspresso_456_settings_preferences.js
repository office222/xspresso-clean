// xspresso_456_settings_preferences.js
// Settings and preferences helpers for Xspresso

export function buildDefaultSettings() {
  return {
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
}

export function updateSettings(settings, updates) {
  return {
    ...settings,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

export function setTone(settings, tone) {
  return {
    ...settings,
    tone,
  };
}
