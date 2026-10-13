// Xspresso notifications center v2
export function createNotification({ id, type = 'info', title = '', message = '', campaignId = null, read = false, createdAt = new Date().toISOString() }) {
  return { id, type, title, message, campaignId, read, createdAt };
}

export function markNotificationRead(notification) {
  return { ...notification, read: true, readAt: new Date().toISOString() };
}

export function addNotification(center, notification) {
  return {
    unread: (center.unread || 0) + (notification.read ? 0 : 1),
    items: [notification, ...(center.items || [])]
  };
}

export function buildNotificationAction(notification) {
  if (notification.type === 'critical') return 'Review now';
  if (notification.type === 'warning') return 'Fix when ready';
  return 'View details';
}
