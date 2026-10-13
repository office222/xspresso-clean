const notifications = [];

export function pushNotification({ title, message, level = 'info', action = null }) {
  const note = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    message,
    level,
    action,
    read: false,
    createdAt: new Date().toISOString()
  };

  notifications.unshift(note);
  return note;
}

export function listNotifications() {
  return [...notifications];
}

export function markNotificationRead(id) {
  const note = notifications.find(item => item.id === id);
  if (note) note.read = true;
  return note;
}

export function buildNotificationsHtml(items = notifications) {
  if (!items.length) {
    return '<div class="empty-state">No alerts right now.</div>';
  }

  return items.map(item => `
    <article class="notification notification-${item.level} ${item.read ? 'is-read' : ''}">
      <h4>${item.title}</h4>
      <p>${item.message}</p>
      ${item.action ? `<button data-action="${item.action}">Do this next</button>` : ''}
    </article>
  `).join('');
}
