// Xspresso Alerts + Notifications v2

export function buildAlert({ campaignId, adId, title, message, level = 'warning' }) {
  return {
    id: `alt_${Date.now()}`,
    campaignId: campaignId || null,
    adId: adId || null,
    title: title || 'Alert',
    message: message || '',
    level,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}

export function evaluateCampaignAlerts(campaign) {
  const alerts = [];
  if (!campaign) return alerts;

  if ((campaign.cpc ?? 0) > 1.5) {
    alerts.push(buildAlert({
      campaignId: campaign.id,
      title: 'CPC is rising',
      message: 'This campaign may need a tweak before more credits are spent.',
      level: 'warning',
    }));
  }

  if ((campaign.conversions ?? 0) === 0 && (campaign.clicks ?? 0) > 20) {
    alerts.push(buildAlert({
      campaignId: campaign.id,
      title: 'Underperforming ad',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      level: 'critical',
    }));
  }

  if ((campaign.ctr ?? 0) < 0.8) {
    alerts.push(buildAlert({
      campaignId: campaign.id,
      title: 'CTR is low',
      message: 'Try a new title, hook, or angle.',
      level: 'warning',
    }));
  }

  return alerts;
}

export function buildNotification(alert) {
  let action = 'Review this campaign.';
  if (alert.title === 'Underperforming ad') action = 'Regenerate this ad with a new title, hook, or angle.';
  if (alert.title === 'CPC is rising') action = 'Test a new headline or lower-cost angle.';

  return {
    title: alert.title,
    message: alert.message,
    level: alert.level,
    action,
  };
}

export function dismissAlert(alert) {
  return { ...alert, status: 'dismissed', dismissedAt: new Date().toISOString() };
}

export function resolveAlert(alert) {
  return { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() };
}
