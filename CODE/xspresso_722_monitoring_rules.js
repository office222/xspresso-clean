// xspresso_722_monitoring_rules.js
// Monitoring and ad-health evaluation.

export function evaluateAdHealth(ad = {}) {
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const clicks = Number(ad.clicks || 0);
  const conversions = Number(ad.conversions || 0);

  if (conversions === 0 && clicks >= 20) {
    return {
      status: 'underperforming',
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.',
    };
  }

  if (cpc >= 1.5) {
    return {
      status: 'warning',
      message: 'CPC is rising.',
      recommendation: 'Try a new headline or lower-cost angle.',
    };
  }

  if (ctr > 0 && ctr < 0.8) {
    return {
      status: 'warning',
      message: 'CTR is low.',
      recommendation: 'Test a stronger hook or CTA.',
    };
  }

  return {
    status: 'healthy',
    message: 'This ad is performing well.',
    recommendation: 'Keep monitoring.',
  };
}

export function buildAlert(ad) {
  const health = evaluateAdHealth(ad);
  return {
    id: `alert_${Date.now()}`,
    title: health.message,
    message: health.recommendation,
    status: health.status,
    createdAt: new Date().toISOString(),
  };
}

export function shouldSuggestRegeneration(ad) {
  const health = evaluateAdHealth(ad);
  return health.status === 'underperforming';
}
