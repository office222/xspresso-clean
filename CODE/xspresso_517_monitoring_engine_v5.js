export const AdStatus = {
  RUNNING: 'running',
  WARNING: 'warning',
  UNDERPERFORMING: 'underperforming',
  NEEDS_REVIEW: 'needs_review',
  PAUSED: 'paused'
};

export function evaluateAdHealth(ad = {}) {
  const poorCTR = typeof ad.ctr === 'number' && ad.ctr < 0.8;
  const highCPC = typeof ad.cpc === 'number' && ad.cpc > 1.5;
  const noConversions = (ad.conversions || 0) === 0 && (ad.clicks || 0) > 20;

  if (noConversions || highCPC || poorCTR) {
    return {
      status: AdStatus.UNDERPERFORMING,
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    };
  }

  if (typeof ad.cpc === 'number' && ad.cpc > 1.0) {
    return {
      status: AdStatus.WARNING,
      message: 'CPC is rising.',
      recommendation: 'Try a stronger headline or a different angle.'
    };
  }

  return {
    status: AdStatus.RUNNING,
    message: 'This ad is performing well enough to keep monitoring.',
    recommendation: 'Keep watching performance.'
  };
}

export function buildAlert(ad = {}) {
  const health = evaluateAdHealth(ad);
  return {
    adId: ad.id || null,
    title: ad.name || 'Untitled Ad',
    status: health.status,
    message: health.message,
    recommendation: health.recommendation,
    createdAt: new Date().toISOString()
  };
}

export function buildMonitoringSummary(ads = []) {
  return ads.reduce((summary, ad) => {
    const health = evaluateAdHealth(ad);
    summary.total += 1;
    summary[health.status] = (summary[health.status] || 0) + 1;
    return summary;
  }, { total: 0, running: 0, warning: 0, underperforming: 0, needs_review: 0, paused: 0 });
}
