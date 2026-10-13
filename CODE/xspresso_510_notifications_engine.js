// Xspresso - Notifications Engine
// Purpose: create concise alerts and suggestions for the dashboard.

export const NotificationLevel = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

export function createNotification({ title, message, level = NotificationLevel.WARNING, action = '' }) {
  return {
    id: `note_${Date.now()}`,
    title,
    message,
    level,
    action,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

export function evaluateAdHealth(ad = {}) {
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const clicks = Number(ad.clicks || 0);
  const conversions = Number(ad.conversions || 0);

  if (conversions === 0 && clicks >= 20) {
    return createNotification({
      title: 'Underperforming ad',
      message: 'This ad is underperforming. Improve it before spending more credits.',
      level: NotificationLevel.CRITICAL,
      action: 'Regenerate this ad with a new title, hook, or angle.'
    });
  }

  if (cpc > 1.5) {
    return createNotification({
      title: 'CPC is rising',
      message: 'This campaign may need a tweak before you spend more credits.',
      level: NotificationLevel.WARNING,
      action: 'Try a new title or hook.'
    });
  }

  if (ctr > 0 && ctr < 0.8) {
    return createNotification({
      title: 'CTR is low',
      message: 'Try a stronger headline or a different angle.',
      level: NotificationLevel.WARNING,
      action: 'Regenerate the hook or headline.'
    });
  }

  return createNotification({
    title: 'Campaign looks healthy',
    message: 'Keep monitoring and let Xspresso watch for changes.',
    level: NotificationLevel.INFO,
    action: 'Keep monitoring.'
  });
}

export function dismissNotification(note) {
  return { ...note, status: 'dismissed', dismissedAt: new Date().toISOString() };
}
