export function evaluateAdPerformance(ad, thresholds = { cpcWarning: 1.5, ctrWarning: 0.8, noConversionClicks: 20 }) {
  const issues = [];

  if ((ad.clicks || 0) >= thresholds.noConversionClicks && (ad.conversions || 0) === 0) {
    issues.push({
      type: 'underperforming',
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    });
  }

  if ((ad.cpc || 0) >= thresholds.cpcWarning) {
    issues.push({
      type: 'cpc_warning',
      message: 'CPC is rising.',
      recommendation: 'Try a new title or a lower-cost angle.'
    });
  }

  if ((ad.ctr || 0) > 0 && (ad.ctr || 0) < thresholds.ctrWarning) {
    issues.push({
      type: 'ctr_warning',
      message: 'CTR is low.',
      recommendation: 'Test a stronger hook or headline.'
    });
  }

  return {
    healthy: issues.length === 0,
    issues,
    nextAction: issues.length ? issues[0].recommendation : 'Keep monitoring.'
  };
}

export function buildMonitoringAlert(ad) {
  const result = evaluateAdPerformance(ad);

  return {
    adId: ad.id,
    name: ad.name,
    status: result.healthy ? 'healthy' : 'warning',
    message: result.healthy ? 'This ad is performing well.' : result.issues[0].message,
    recommendation: result.nextAction
  };
}

export function shouldRegenerateAd(ad) {
  const result = evaluateAdPerformance(ad);
  return !result.healthy && result.issues.some(issue => issue.type === 'underperforming');
}
