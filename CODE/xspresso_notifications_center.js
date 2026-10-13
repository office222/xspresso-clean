// xspresso_notifications_center.js
// Xspresso Notifications & Alert Center

/*
Handles:
- campaign alerts (underperforming ads, missing info, high CPC, etc)
- system suggestions (regenerate, approve, fix, monitor)
- status messages (launch confirmation, errors, warnings)
*/

const alertLevels = { INFO: 'info', WARNING: 'warning', ERROR: 'error' };

// Render notifications list
export function renderNotificationsCenter(notifications = []) {
  if (!notifications.length) {
    return `<div class="notification-center"><p>No notifications! Marketing is humming along.</p></div>`;
  }
  return `<div class="notification-center">
    <h3>Alerts & Suggestions</h3>
    <ul>
      ${notifications.map(n => `<li class="notif ${n.level}">
        <strong>${n.title || 'Xspresso Message'}</strong><br>
        <span>${n.message}</span>
        <span class="notif-action">${n.action ? `<em>${n.action}</em>` : ''}</span>
        <span class="notif-time">${n.time || ''}</span>
      </li>`).join('')}
    </ul>
  </div>`;
}

// Sample notification structure:
// { 
//   id, title, message, level: 'info'|'warning'|'error', action: '', time
// }
