export const AdStatus = {
  RUNNING: 'running',
  WARNING: 'warning',
  UNDERPERFORMING: 'underperforming',
  NEEDS_REVIEW: 'needs_review'
};

export function evaluateAdPerformance(ad = {}) {
  const ctr = ad.ctr ?? 0;
  const cpc = ad.cpc ?? 0;
  const clicks = ad.clicks ?? 0;
  const conversions = ad.conversions ?? 0;

  if (conversions === 0 && clicks > 20) {
    return {
      status: AdStatus.UNDERPERFORMING,
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    };
  }

  if (cpc >= 1.5 || ctr < 0.8) {
    return {
      status: AdStatus.WARNING,
      message: 'This ad may need a tweak.',
      recommendation: 'Test a new headline, hook, or CTA.'
    };
  }

  return {
    status: AdStatus.RUNNING,
    message: 'This ad is performing well.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildMonitoringAlert(ad = {}) {
  const result = evaluateAdPerformance(ad);
  return {
    id: ad.id || `ad_${Date.now()}`,
    title: ad.name || 'Monitored Ad',
    status: result.status,
    message: result.message,
    recommendation: result.recommendation,
    createdAt: new Date().toISOString()
  };
}