// xspresso_698_notifications_center_v6.js
// Notification and alerts center helpers

export function createNotification({ title, message, level = 'info', campaignId = null, adId = null }) {
  return {
    id: `notif_${Date.now()}`,
    title,
    message,
    level,
    campaignId,
    adId,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

export function createNotificationFeed(alerts = []) {
  return alerts.map(alert => ({
    id: alert.id,
    title: alert.title,
    message: alert.message,
    level: alert.level,
    status: alert.status || 'open',
    action: alert.action || 'Review this campaign.'
  }));
}

export function dismissNotification(notification = {}) {
  return {
    ...notification,
    status: 'dismissed',
    dismissedAt: new Date().toISOString()
  };
}

export function resolveNotification(notification = {}) {
  return {
    ...notification,
    status: 'resolved',
    resolvedAt: new Date().toISOString()
  };
}

export function summarizeNotifications(notifications = []) {
  return {
    total: notifications.length,
    unread: notifications.filter(n => n.status === 'open').length,
    critical: notifications.filter(n => n.level === 'critical').length,
    warnings: notifications.filter(n => n.level === 'warning').length
  };
}
