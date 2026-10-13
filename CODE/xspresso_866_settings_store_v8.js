const STORAGE_KEY = 'xspresso_settings_v8';

const defaultSettings = {
  tone: 'simple',
  defaultGoal: 'sales',
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
  },
  credits: {
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0
  }
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : structuredClone(defaultSettings);
  } catch {
    return structuredClone(defaultSettings);
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

export function updateSettings(current, updates = {}) {
  const next = {
    ...current,
    ...updates,
    alertThresholds: {
      ...current.alertThresholds,
      ...(updates.alertThresholds || {})
    },
    platformDefaults: {
      ...current.platformDefaults,
      ...(updates.platformDefaults || {})
    },
    credits: {
      ...current.credits,
      ...(updates.credits || {})
    },
    updatedAt: new Date().toISOString()
  };
  return saveSettings(next);
}

export function resetSettings() {
  return saveSettings(structuredClone(defaultSettings));
}

export { defaultSettings };
