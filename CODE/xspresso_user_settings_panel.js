// Xspresso User Settings Panel
// Core UI logic for settings/preferences (profile, notifications, tone, platform, etc.)

export default function UserSettingsPanel({ settings, onSave }) {
  // Render settings form: name, email, notification prefs, tone etc.
  return `
    <div class="user-settings-panel">
      <h2>User Settings</h2>
      <div>
        <label>Name:</label><input type="text" value="${settings.name||''}" />
      </div>
      <div>
        <label>Email:</label><input type="email" value="${settings.email||''}" />
      </div>
      <div>
        <label>Preferred Tone:</label>
        <select>
          <option value="simple">Simple</option>
          <option value="friendly">Friendly</option>
          <option value="bold">Bold</option>
          <option value="premium">Premium</option>
        </select>
      </div>
      <div>
        <label>Notifications:</label>
        <input type="checkbox" checked /> Email Alerts
      </div>
      <button onclick="${onSave}">Save Settings</button>
    </div>
  `;
}
