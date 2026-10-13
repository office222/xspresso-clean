// xspresso_411_settings_panel.js
// App settings and preferences panel for Xspresso.

export const defaultSettings = {
  tone: 'simple',
  defaultGoal: 'sales',
  defaultPlatform: 'general',
  monitoringEnabled: true,
  keepMonitoringOnSwitch: false,
  rushSwitchEnabled: true,
  alertThresholds: {
    cpcWarning: 1.5,
    cpcCritical: 2.0,
    ctrWarning: 0.8,
    ctrCritical: 0.5,
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
    updatedAt: new Date().toISOString(),
  };
}

export function renderSettingsPanel(settings = defaultSettings) {
  return `
    <section class="panel settings-panel">
      <h2>Settings</h2>
      <div class="settings-group">
        <label>Tone: <input type="text" value="${settings.tone}"></label>
        <label>Default Goal: <input type="text" value="${settings.defaultGoal}"></label>
        <label>Default Platform: <input type="text" value="${settings.defaultPlatform}"></label>
      </div>
      <div class="settings-group">
        <label><input type="checkbox" ${settings.monitoringEnabled ? 'checked' : ''}> Monitoring Enabled</label>
        <label><input type="checkbox" ${settings.keepMonitoringOnSwitch ? 'checked' : ''}> Keep Monitoring on Platform Switch</label>
        <label><input type="checkbox" ${settings.rushSwitchEnabled ? 'checked' : ''}> Rush Switch Enabled</label>
      </div>
      <div class="settings-group">
        <p><strong>Alert thresholds</strong></p>
        <p>CPC Warning: ${settings.alertThresholds.cpcWarning}</p>
        <p>CPC Critical: ${settings.alertThresholds.cpcCritical}</p>
        <p>CTR Warning: ${settings.alertThresholds.ctrWarning}</p>
        <p>CTR Critical: ${settings.alertThresholds.ctrCritical}</p>
      </div>
      <p class="settings-note">The user should be able to set defaults without digging through advanced menus.</p>
    </section>
  `;
}
