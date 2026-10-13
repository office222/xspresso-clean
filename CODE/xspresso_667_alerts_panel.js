// xspresso_667_alerts_panel.js
// Alert creation, evaluation, and notification helpers

function buildAlert({ campaignId, adId, title, message, level = 'warning' }) {
  return {
    id: `alt_${Date.now()}`,
    campaignId: campaignId || null,
    adId: adId || null,
    title,
    message,
    level,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

function evaluateAdHealth(ad, thresholds = {}) {
  const cpcWarning = thresholds.cpcWarning ?? 1.5;
  const cpcCritical = thresholds.cpcCritical ?? 2.0;
  const ctrWarning = thresholds.ctrWarning ?? 0.8;
  const ctrCritical = thresholds.ctrCritical ?? 0.5;

  const alerts = [];

  if (ad.cpc >= cpcCritical) {
    alerts.push(buildAlert({
      campaignId: ad.campaignId,
      adId: ad.id,
      title: 'CPC is critical',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      level: 'critical'
    }));
  } else if (ad.cpc >= cpcWarning) {
    alerts.push(buildAlert({
      campaignId: ad.campaignId,
      adId: ad.id,
      title: 'CPC is rising',
      message: 'This ad may need a tweak before you spend more credits.',
      level: 'warning'
    }));
  }

  if ((ad.ctr || 0) <= ctrCritical) {
    alerts.push(buildAlert({
      campaignId: ad.campaignId,
      adId: ad.id,
      title: 'CTR is very low',
      message: 'Try a new title, hook, or angle.',
      level: 'critical'
    }));
  } else if ((ad.ctr || 0) <= ctrWarning) {
    alerts.push(buildAlert({
      campaignId: ad.campaignId,
      adId: ad.id,
      title: 'CTR is low',
      message: 'This ad may benefit from a stronger hook.',
      level: 'warning'
    }));
  }

  if ((ad.conversions || 0) === 0 && (ad.clicks || 0) > 20) {
    alerts.push(buildAlert({
      campaignId: ad.campaignId,
      adId: ad.id,
      title: 'Underperforming ad',
      message: 'Regenerate this ad with a new title, hook, or angle before spending more credits.',
      level: 'critical'
    }));
  }

  return alerts;
}

function resolveAlert(alert) {
  return {
    ...alert,
    status: 'resolved',
    resolvedAt: new Date().toISOString()
  };
}

function dismissAlert(alert) {
  return {
    ...alert,
    status: 'dismissed',
    dismissedAt: new Date().toISOString()
  };
}

module.exports = {
  buildAlert,
  evaluateAdHealth,
  resolveAlert,
  dismissAlert
};