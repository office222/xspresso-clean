export const NotificationLevel = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
});

export function createNotification({ title, message, level = NotificationLevel.INFO, action = null, campaignId = null, adId = null }) {
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    title,
    message,
    level,
    action,
    campaignId,
    adId,
    read: false,
    createdAt: new Date().toISOString()
  };
}

export function buildUnderperformingAdNotification(ad) {
  return createNotification({
    title: 'This ad is underperforming.',
    message: 'Improve it before spending more credits monitoring an ad that is not performing.',
    level: NotificationLevel.CRITICAL,
    action: 'Regenerate this ad with a new title, hook, or angle.',
    campaignId: ad?.campaignId || null,
    adId: ad?.id || null
  });
}

export function buildCpcWarningNotification(ad) {
  return createNotification({
    title: 'CPC is rising.',
    message: 'This campaign may need a tweak before you spend more credits.',
    level: NotificationLevel.WARNING,
    action: 'Try a new title or hook.',
    campaignId: ad?.campaignId || null,
    adId: ad?.id || null
  });
}

export function markNotificationRead(notification) {
  return { ...notification, read: true, readAt: new Date().toISOString() };
}

export function clearReadNotifications(notifications) {
  return notifications.filter(n => !n.read);
}
