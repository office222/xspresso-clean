// Xspresso Settings & Preferences v2

export const defaultSettings = {
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

export function updateSettings(settings, updates) {
  return {
    ...settings,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

export function setTone(settings, tone) {
  const allowed = ['simple', 'friendly', 'bold', 'premium', 'direct', 'persuasive'];
  if (!allowed.includes(tone)) return settings;
  return { ...settings, tone };
}

export function setMonitoringThresholds(settings, thresholds) {
  return {
    ...settings,
    alertThresholds: {
      ...settings.alertThresholds,
      ...thresholds,
    },
  };
}

export function setPlatformBehavior(settings, options) {
  return {
    ...settings,
    platformDefaults: {
      ...settings.platformDefaults,
      ...options,
    },
  };
}
