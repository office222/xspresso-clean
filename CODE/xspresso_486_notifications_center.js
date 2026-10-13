// xspresso_486_notifications_center.js
// Notification helpers for Xspresso V1

export function createNotification({ title, message, level = "info", action = "Review" } = {}) {
  return {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: title || "Notice",
    message: message || "",
    level,
    action,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export function buildNotificationFromAlert(alert = {}) {
  return createNotification({
    title: alert.title || "Campaign alert",
    message: alert.message || "",
    level: alert.level || "warning",
    action: alert.recommendation || "Review campaign",
  });
}

export function markNotificationRead(notification) {
  return {
    ...notification,
    read: true,
    readAt: new Date().toISOString(),
  };
}

export function buildNotificationFeed(alerts = []) {
  return alerts.map(buildNotificationFromAlert);
}

export function groupNotificationsByLevel(notifications = []) {
  return notifications.reduce((acc, item) => {
    const key = item.level || "info";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}
