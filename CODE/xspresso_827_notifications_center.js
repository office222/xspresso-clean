// xspresso_827_notifications_center.js
// Notifications helpers for alerts and actions.

export function createNotification({ title, message, level = 'info', action = null }) {
  return {
    id: `ntf_${Date.now()}`,
    title,
    message,
    level,
    action,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

export function buildAlertNotification(campaign) {
  if ((campaign?.conversions ?? 0) === 0 && (campaign?.clicks ?? 0) > 20) {
    return createNotification({
      title: 'This ad is underperforming.',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      level: 'critical',
      action: 'Regenerate this ad with a new title, hook, or angle.'
    });
  }

  if ((campaign?.cpc ?? 0) > 1.5) {
    return createNotification({
      title: 'CPC is rising.',
      message: 'This campaign may need a tweak before you spend more credits.',
      level: 'warning',
      action: 'Try a new title or hook.'
    });
  }

  return createNotification({
    title: 'Campaign looks healthy.',
    message: 'Keep monitoring and watch for changes.',
    level: 'info',
    action: 'Keep watching.'
  });
}

export function dismissNotification(notification) {
  return { ...notification, status: 'dismissed', dismissedAt: new Date().toISOString() };
}
