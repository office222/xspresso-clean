export function createNotification({ title, message, level = 'info', campaignId = null, adId = null }) {
  return {
    id: `note_${Date.now()}`,
    title,
    message,
    level,
    campaignId,
    adId,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

export function resolveNotification(notification) {
  return {
    ...notification,
    status: 'resolved',
    resolvedAt: new Date().toISOString()
  };
}

export function dismissNotification(notification) {
  return {
    ...notification,
    status: 'dismissed',
    dismissedAt: new Date().toISOString()
  };
}
