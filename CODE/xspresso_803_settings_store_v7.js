const defaultSettings = {
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

export function createSettingsStore(initial = {}) {
  let settings = { ...defaultSettings, ...initial };

  return {
    get() { return settings; },
    update(patch = {}) { settings = { ...settings, ...patch, updatedAt: new Date().toISOString() }; return settings; },
    setTone(tone) { settings = { ...settings, tone }; return settings; },
    reset() { settings = { ...defaultSettings }; return settings; }
  };
}
