// xspresso_552_alerts_center.js
// Alerts / notifications scaffolding for Xspresso V1.

export const AlertLevel = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

export function createAlert({ campaignId = null, adId = null, title = '', message = '', level = AlertLevel.WARNING }) {
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

export function buildPerformanceAlert(adEvaluation = {}) {
  if (!adEvaluation || adEvaluation.status === 'healthy') return null;

  const title = adEvaluation.status === 'underperforming' ? 'Underperforming ad' : 'Campaign warning';
  const message = adEvaluation.message || 'This campaign may need attention.';
  return createAlert({
    adId: adEvaluation.adId || null,
    title,
    message,
    level: adEvaluation.status === 'underperforming' ? AlertLevel.CRITICAL : AlertLevel.WARNING
  });
}

export function resolveAlert(alert) {
  return {
    ...alert,
    status: 'resolved',
    resolvedAt: new Date().toISOString()
  };
}

export function dismissAlert(alert) {
  return {
    ...alert,
    status: 'dismissed',
    dismissedAt: new Date().toISOString()
  };
}

export function buildAlertFeed(alerts = []) {
  return alerts
    .filter(Boolean)
    .map((alert) => ({
      ...alert,
      action:
        alert.level === AlertLevel.CRITICAL
          ? 'Regenerate this ad'
          : 'Review and tweak'
    }));
}