// xspresso_505_alerts_center_v4.js
// Alert helpers for underperforming ads and campaign issues.

export const AlertLevel = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
});

export function createAlert({ title, message, level = AlertLevel.WARNING, campaignId = null, adId = null }) {
  return {
    id: `alt_${Date.now()}`,
    title,
    message,
    level,
    campaignId,
    adId,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

export function evaluateAdHealth(ad) {
  const issues = [];
  if (typeof ad.ctr === 'number' && ad.ctr < 0.8) issues.push('low_ctr');
  if (typeof ad.cpc === 'number' && ad.cpc > 1.5) issues.push('high_cpc');
  if ((ad.clicks || 0) > 20 && (ad.conversions || 0) === 0) issues.push('no_conversions');
  return issues;
}

export function buildAdAlert(ad) {
  const issues = evaluateAdHealth(ad);
  if (!issues.length) {
    return createAlert({
      title: 'Ad looks healthy',
      message: 'Keep monitoring this ad.',
      level: AlertLevel.INFO,
      campaignId: ad.campaignId,
      adId: ad.id
    });
  }
  return createAlert({
    title: 'This ad is underperforming',
    message: 'Improve it before spending more credits. Xspresso can regenerate this ad with a new title, hook, or angle.',
    level: issues.includes('no_conversions') ? AlertLevel.CRITICAL : AlertLevel.WARNING,
    campaignId: ad.campaignId,
    adId: ad.id
  });
}

export function dismissAlert(alert) {
  return { ...alert, status: 'dismissed', dismissedAt: new Date().toISOString() };
}

export function resolveAlert(alert) {
  return { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() };
}
