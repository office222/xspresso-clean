// xspresso_629_alerts_center_v8.js

export const AlertLevel = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

export function createAlert({ campaignId = null, adId = null, title, message, level = AlertLevel.WARNING, action = 'Review this campaign.' }) {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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

export function resolveAlert(alert) {
  return { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() };
}

export function dismissAlert(alert) {
  return { ...alert, status: 'dismissed', dismissedAt: new Date().toISOString() };
}

export function evaluateCampaignForAlerts(campaign = {}) {
  const alerts = [];

  if ((campaign.conversions || 0) === 0 && (campaign.clicks || 0) > 20) {
    alerts.push(createAlert({
      campaignId: campaign.id,
      adId: campaign.adId || null,
      title: 'Underperforming ad',
      message: 'This ad is underperforming. Improve it before spending more credits.',
      level: AlertLevel.CRITICAL,
      action: 'Regenerate this ad with a new title, hook, or angle.',
    }));
  }

  if ((campaign.cpc || 0) > 1.5) {
    alerts.push(createAlert({
      campaignId: campaign.id,
      adId: campaign.adId || null,
      title: 'CPC rising',
      message: 'CPC is rising. This campaign may need a tweak.',
      level: AlertLevel.WARNING,
      action: 'Test a new headline or lower-cost angle.',
    }));
  }

  return alerts;
}
