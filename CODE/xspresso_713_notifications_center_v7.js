const LEVELS = {
  info: 'info',
  warning: 'warning',
  critical: 'critical'
};

export function createNotification({ title, message, level = LEVELS.info, action = '', campaignId = null } = {}) {
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    message,
    level,
    action,
    campaignId,
    status: 'unread',
    createdAt: new Date().toISOString()
  };
}

export function createPerformanceNotification(campaign = {}) {
  if ((campaign.conversions || 0) > 0 && (campaign.cpc || 0) <= 1.5) {
    return createNotification({
      title: 'Campaign healthy',
      message: 'This campaign is performing well. Keep monitoring it.',
      level: LEVELS.info,
      action: 'Keep monitoring',
      campaignId: campaign.id
    });
  }

  if ((campaign.conversions || 0) === 0 && (campaign.clicks || 0) > 20) {
    return createNotification({
      title: 'Underperforming ad',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      level: LEVELS.critical,
      action: 'Regenerate this ad',
      campaignId: campaign.id
    });
  }

  if ((campaign.cpc || 0) > 1.5) {
    return createNotification({
      title: 'CPC rising',
      message: 'This ad may need a tweak before you spend more credits.',
      level: LEVELS.warning,
      action: 'Try a new hook',
      campaignId: campaign.id
    });
  }

  return createNotification({
    title: 'Needs review',
    message: 'This campaign may need a closer look.',
    level: LEVELS.warning,
    action: 'Review campaign',
    campaignId: campaign.id
  });
}

export function markNotificationRead(notification) {
  return { ...notification, status: 'read', readAt: new Date().toISOString() };
}

export function dismissNotification(notification) {
  return { ...notification, status: 'dismissed', dismissedAt: new Date().toISOString() };
}
