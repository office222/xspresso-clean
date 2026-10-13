// xspresso_735_notifications_center.js
// Notification helpers for alerts, warnings, and updates.

import { addNotification } from './xspresso_731_app_state_store.js';

export function notify(message, type = 'info', meta = {}) {
  const notification = {
    id: `ntf_${Date.now()}`,
    message,
    type,
    meta,
    createdAt: new Date().toISOString(),
    read: false
  };

  addNotification(notification);
  return notification;
}

export function buildAlertNotification(alert) {
  return notify(alert.message, alert.severity || 'warning', {
    campaignId: alert.campaignId || null,
    adId: alert.adId || null,
    action: alert.recommendation || null
  });
}

export function markAsRead(notification) {
  return {
    ...notification,
    read: true,
    readAt: new Date().toISOString()
  };
}

export function unreadCount(notifications = []) {
  return notifications.filter((item) => !item.read).length;
}

export function notificationSummary(notifications = []) {
  return {
    unread: unreadCount(notifications),
    total: notifications.length,
    latest: notifications[0] || null
  };
}
