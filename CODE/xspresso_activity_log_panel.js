// Xspresso Activity Log Panel
// UI and logic for user activity and credits usage tracking

export default function ActivityLogPanel({ activities }) {
  return `
    <div class="activity-log-panel">
      <h2>Activity Log</h2>
      <ul>
        ${activities.map(a => `<li>[${a.date}] ${a.message}</li>`).join('')}
      </ul>
      <div class="activity-log-footer">
        <small>You have ${activities.length} logged actions.</small>
      </div>
    </div>
  `;
}
