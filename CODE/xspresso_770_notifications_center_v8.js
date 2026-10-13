export function createNotification(input = {}) {
  return {
    id: input.id || `ntf_${Date.now()}`,
    title: input.title || 'Update',
    message: input.message || '',
    level: input.level || 'info',
    campaignId: input.campaignId || null,
    status: 'open',
    createdAt: input.createdAt || new Date().toISOString()
  };
}

export function summarizeNotification(notification) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    level: notification.level,
    status: notification.status
  };
}
