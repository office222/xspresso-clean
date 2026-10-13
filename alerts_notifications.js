// Xspresso V1 — Alerts and Notifications
// Purpose: warn users early, explain what changed, and suggest the next best action.

const AlertLevel = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

function buildAlert({ campaignId = null, adId = null, title = '', message = '', level = AlertLevel.WARNING }) {
  return {
    id: `alt_${Date.now()}`,
    campaignId,
    adId,
    title,
    message,
    level,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

function evaluateCampaignForAlerts(campaign) {
  const alerts = [];

  if (campaign.cpc > 1.5) {
    alerts.push(buildAlert({
      campaignId: campaign.id,
      adId: campaign.adId || null,
      title: 'CPC is rising',
      message: 'This ad may need a tweak before you spend more credits.',
      level: AlertLevel.WARNING
    }));
  }

  if (campaign.conversions === 0 && campaign.clicks > 20) {
    alerts.push(buildAlert({
      campaignId: campaign.id,
      adId: campaign.adId || null,
      title: 'Underperforming ad',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      level: AlertLevel.CRITICAL
    }));
  }

  if (campaign.ctr && campaign.ctr < 0.8) {
    alerts.push(buildAlert({
      campaignId: campaign.id,
      adId: campaign.adId || null,
      title: 'CTR is low',
      message: 'Try a new title, hook, or angle.',
      level: AlertLevel.WARNING
    }));
  }

  return alerts;
}

function buildNotification(alert) {
  let action = 'Review this campaign.';

  if (alert.title === 'Underperforming ad') {
    action = 'Regenerate this ad with a new title, hook, or angle.';
  }

  if (alert.title === 'CPC is rising') {
    action = 'Try a new headline or lower-cost angle.';
  }

  return {
    title: alert.title,
    message: alert.message,
    action
  };
}

function dismissAlert(alert) {
  return {
    ...alert,
    status: 'dismissed',
    dismissedAt: new Date().toISOString()
  };
}

function resolveAlert(alert) {
  return {
    ...alert,
    status: 'resolved',
    resolvedAt: new Date().toISOString()
  };
}

function buildAlertFeed(alerts) {
  return alerts.map(alert => ({
    id: alert.id,
    title: alert.title,
    message: alert.message,
    level: alert.level,
    status: alert.status,
    action: buildNotification(alert).action
  }));
}

const notificationCenter = {
  unread: 0,
  alerts: [],
  lastChecked: new Date().toISOString()
};

function addNotification(center, alert) {
  return {
    ...center,
    unread: center.unread + 1,
    alerts: [alert, ...center.alerts]
  };
}

function markNotificationRead(center, alertId) {
  return {
    ...center,
    unread: Math.max(center.unread - 1, 0),
    alerts: center.alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: 'read' } : alert
    )
  };
}

/*
Friendly UI copy:
- This ad is underperforming.
- Improve it before spending more credits.
- Xspresso can regenerate this ad.
- CPC is rising.
- This campaign may need a tweak.
- Tracking paused on [Platform Name].
*/
