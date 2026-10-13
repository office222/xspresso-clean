// xspresso_583_monitoring_engine_v6.js
// Monitoring and ad health helpers for Xspresso.

export function evaluateAdHealth(ad = {}) {
  const clicks = ad.clicks || 0;
  const conversions = ad.conversions || 0;
  const cpc = ad.cpc ?? 0;
  const ctr = ad.ctr ?? 0;

  if (clicks >= 20 && conversions === 0) {
    return {
      status: 'underperforming',
      level: 'critical',
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.',
    };
  }

  if (cpc > 1.5 || ctr < 0.8) {
    return {
      status: 'warning',
      level: 'warning',
      message: 'This ad may need a tweak.',
      recommendation: 'Test a new title, hook, or CTA.',
    };
  }

  return {
    status: 'healthy',
    level: 'good',
    message: 'This ad is performing acceptably.',
    recommendation: 'Keep monitoring.',
  };
}

export function buildMonitoringAlert(ad = {}) {
  const health = evaluateAdHealth(ad);
  return {
    adId: ad.id || null,
    title: ad.name || 'Untitled Ad',
    level: health.level,
    status: health.status,
    message: health.message,
    recommendation: health.recommendation,
    createdAt: new Date().toISOString(),
  };
}

export function shouldEscalate(ad = {}) {
  const health = evaluateAdHealth(ad);
  return health.level === 'critical';
}

export function suggestedActionForAd(ad = {}) {
  const health = evaluateAdHealth(ad);

  if (health.status === 'underperforming') return 'regenerate';
  if (health.status === 'warning') return 'tweak';
  return 'monitor';
}
