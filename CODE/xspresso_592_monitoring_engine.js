// xspresso_592_monitoring_engine.js
// Monitoring and ad health helpers.

export function evaluateAdHealth(ad = {}) {
  const poorCTR = (ad.ctr ?? 0) < 0.8;
  const highCPC = (ad.cpc ?? 0) > 1.5;
  const noConversions = (ad.conversions ?? 0) === 0 && (ad.clicks ?? 0) > 20;

  if (noConversions || highCPC || poorCTR) {
    return {
      status: 'underperforming',
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    };
  }

  return {
    status: 'healthy',
    message: 'This ad is performing acceptably.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildMonitoringAlert(ad = {}) {
  const health = evaluateAdHealth(ad);
  return {
    adName: ad.name || 'Untitled Ad',
    ...health,
    createdAt: new Date().toISOString()
  };
}