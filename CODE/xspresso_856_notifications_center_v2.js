export function createNotification({ title, message, level = 'info', action = 'view' }) {
  return {
    id: `note_${Date.now()}`,
    title,
    message,
    level,
    action,
    read: false,
    createdAt: new Date().toISOString()
  };
}

export function addNotification(list, notification) {
  return [createNotification(notification), ...(list || [])];
}

export function markNotificationRead(list, id) {
  return (list || []).map(item => item.id === id ? { ...item, read: true } : item);
}

export function unreadCount(list) {
  return (list || []).filter(item => !item.read).length;
}

export function buildNotificationFromAlert(alert) {
  return createNotification({
    title: alert.title || 'Campaign Alert',
    message: alert.message,
    level: alert.level || 'warning',
    action: alert.recommendation || 'review'
  });
}
