// xspresso_615_notifications_center_v4.js
// Notifications center helpers for Xspresso

export const NotificationLevel = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

export function createNotification({ id, title, message, level = NotificationLevel.INFO, campaignId = null, adId = null, createdAt = new Date().toISOString() }) {
  return {
    id: id || `ntf_${Date.now()}`,
    title,
    message,
    level,
    campaignId,
    adId,
    status: 'unread',
    createdAt,
  };
}

export function markNotificationRead(notification) {
  return { ...notification, status: 'read', readAt: new Date().toISOString() };
}

export function buildNotificationAction(notification) {
  if (notification.level === NotificationLevel.CRITICAL) {
    return 'Review now';
  }
  if (notification.level === NotificationLevel.WARNING) {
    return 'Check details';
  }
  return 'View';
}

export function summarizeNotifications(list = []) {
  return {
    total: list.length,
    unread: list.filter(n => n.status !== 'read').length,
    critical: list.filter(n => n.level === NotificationLevel.CRITICAL).length,
    warnings: list.filter(n => n.level === NotificationLevel.WARNING).length,
  };
}
