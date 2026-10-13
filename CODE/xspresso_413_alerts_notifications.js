// xspresso_413_alerts_notifications.js
// Alerts and notification helpers for Xspresso V1

export const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

export function createAlert({ id, campaignId = null, adId = null, title, message, level = ALERT_LEVELS.WARNING, action = null }) {
  return {
    id: id || `alt_${Date.now()}`,
    campaignId,
    adId,
    title,
    message,
    level,
    action,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}

export function evaluatePerformanceAlert(campaign) {
  const alerts = [];

  if (!campaign) return alerts;

  const cpc = Number(campaign.cpc || 0);
  const ctr = Number(campaign.ctr || 0);
  const clicks = Number(campaign.clicks || 0);
  const conversions = Number(campaign.conversions || 0);

  if (cpc >= 1.5) {
    alerts.push(createAlert({
      campaignId: campaign.id,
      title: 'CPC is rising',
      message: 'This ad may need a tweak before more credits are spent.',
      level: ALERT_LEVELS.WARNING,
      action: 'Test a new title or hook',
    }));
  }

  if (ctr > 0 && ctr < 0.8) {
    alerts.push(createAlert({
      campaignId: campaign.id,
      title: 'CTR is low',
      message: 'Try a stronger headline, hook, or angle.',
      level: ALERT_LEVELS.WARNING,
      action: 'Regenerate the headline',
    }));
  }

  if (clicks > 20 && conversions === 0) {
    alerts.push(createAlert({
      campaignId: campaign.id,
      title: 'Underperforming ad',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      level: ALERT_LEVELS.CRITICAL,
      action: 'Regenerate this ad with a new title, hook, or angle',
    }));
  }

  return alerts;
}

export function buildNotification(alert) {
  return {
    id: `note_${alert.id}`,
    title: alert.title,
    message: alert.message,
    level: alert.level,
    action: alert.action,
    createdAt: alert.createdAt,
  };
}

export function dismissAlert(alert) {
  return {
    ...alert,
    status: 'dismissed',
    dismissedAt: new Date().toISOString(),
  };
}

export function resolveAlert(alert) {
  return {
    ...alert,
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
  };
}

export function mapAlertsToFeed(alerts = []) {
  return alerts.map(buildNotification);
}

export default {
  ALERT_LEVELS,
  createAlert,
  evaluatePerformanceAlert,
  buildNotification,
  dismissAlert,
  resolveAlert,
  mapAlertsToFeed,
};
