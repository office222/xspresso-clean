export function createNotification({ type = 'info', title, message, campaignId = null, adId = null }) {
  return {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,
    title,
    message,
    campaignId,
    adId,
    read: false,
    createdAt: new Date().toISOString()
  };
}

export function unreadCount(notifications = []) {
  return notifications.filter(n => !n.read).length;
}

export function markNotificationRead(notifications = [], id) {
  return notifications.map(n => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n));
}

export function buildNotificationAction(notification) {
  if (notification.type === 'critical') return 'Regenerate or pause this ad now.';
  if (notification.type === 'warning') return 'Review this campaign and make a tweak.';
  return 'Review when ready.';
}
