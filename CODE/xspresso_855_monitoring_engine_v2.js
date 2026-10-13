export function evaluateAdPerformance(ad, thresholds = {}) {
  const cpcWarning = thresholds.cpcWarning ?? 1.5;
  const cpcCritical = thresholds.cpcCritical ?? 2.0;
  const ctrWarning = thresholds.ctrWarning ?? 0.8;

  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const clicks = Number(ad.clicks || 0);
  const conversions = Number(ad.conversions || 0);

  if (conversions === 0 && clicks >= 20) {
    return {
      status: 'underperforming',
      severity: 'critical',
      message: 'This ad is underperforming. Improve it before spending more credits monitoring an ad that is not performing.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    };
  }

  if (cpc >= cpcCritical) {
    return {
      status: 'warning',
      severity: 'critical',
      message: 'CPC is high. This ad may need a stronger angle.',
      recommendation: 'Test a new title or hook.'
    };
  }

  if (cpc >= cpcWarning || ctr <= ctrWarning) {
    return {
      status: 'warning',
      severity: 'warning',
      message: 'This ad may need a tweak.',
      recommendation: 'Try a new title, hook, or CTA.'
    };
  }

  return {
    status: 'healthy',
    severity: 'info',
    message: 'This ad is performing well.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildAlert(ad, thresholds) {
  const result = evaluateAdPerformance(ad, thresholds);
  return {
    id: `alert_${Date.now()}`,
    adId: ad.id,
    campaignId: ad.campaignId || null,
    level: result.severity,
    title: ad.name || 'Untitled Ad',
    message: result.message,
    recommendation: result.recommendation,
    createdAt: new Date().toISOString(),
    status: 'open'
  };
}

export function getMonitoringRecommendation(ad, thresholds) {
  const result = evaluateAdPerformance(ad, thresholds);
  return result.recommendation;
}
