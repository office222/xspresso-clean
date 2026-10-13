// Xspresso - Notifications Center v10
// Creates, stores, and resolves alerts and notifications.

function createNotification({ title, message, level = 'info', campaignId = null, adId = null, action = null }) {
  return {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    level,
    campaignId,
    adId,
    action,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

function buildFromAlert(alert) {
  if (!alert) return null;
  return createNotification({
    title: alert.title,
    message: alert.message,
    level: alert.level || 'warning',
    campaignId: alert.campaignId || null,
    adId: alert.adId || null,
    action: alert.action || 'Review campaign'
  });
}

function markRead(notification) {
  return { ...notification, status: 'read', readAt: new Date().toISOString() };
}

function dismiss(notification) {
  return { ...notification, status: 'dismissed', dismissedAt: new Date().toISOString() };
}

function resolve(notification) {
  return { ...notification, status: 'resolved', resolvedAt: new Date().toISOString() };
}

function unreadCount(items = []) {
  return items.filter((item) => item.status === 'open').length;
}

function buildFeed(items = []) {
  return items
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  createNotification,
  buildFromAlert,
  markRead,
  dismiss,
  resolve,
  unreadCount,
  buildFeed
};
