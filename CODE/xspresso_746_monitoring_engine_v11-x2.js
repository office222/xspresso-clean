// Xspresso monitoring engine v11

export const AdStatus = {
  RUNNING: 'running',
  WARNING: 'warning',
  UNDERPERFORMING: 'underperforming',
  NEEDS_REVIEW: 'needs_review',
};

export function evaluateAdPerformance(ad = {}) {
  const poorCTR = (ad.ctr ?? 0) < 0.8;
  const highCPC = (ad.cpc ?? 0) > 1.5;
  const noConversions = (ad.conversions ?? 0) === 0 && (ad.clicks ?? 0) > 20;

  if (noConversions || highCPC || poorCTR) {
    return {
      status: AdStatus.UNDERPERFORMING,
      message: 'This ad is underperforming. Improve it before spending more credits monitoring an ad that is not performing.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.',
    };
  }

  if ((ad.cpc ?? 0) > 1.0 || (ad.ctr ?? 0) < 1.2) {
    return {
      status: AdStatus.WARNING,
      message: 'This ad may need a tweak.',
      recommendation: 'Try a new title, hook, or CTA.',
    };
  }

  return {
    status: AdStatus.RUNNING,
    message: 'This ad is performing acceptably.',
    recommendation: 'Keep monitoring.',
  };
}

export function buildAlert(ad = {}) {
  const result = evaluateAdPerformance(ad);
  return {
    id: `alt_${Date.now()}`,
    campaignId: ad.campaignId || null,
    adId: ad.id || null,
    title: ad.name || 'Ad Alert',
    message: result.message,
    level: result.status === AdStatus.UNDERPERFORMING ? 'critical' : 'warning',
    recommendation: result.recommendation,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}

export function shouldShowRegenerate(ad = {}) {
  return evaluateAdPerformance(ad).status === AdStatus.UNDERPERFORMING;
}

export function buildMonitoringSummary(ads = []) {
  const counts = ads.reduce(
    (acc, ad) => {
      const health = evaluateAdPerformance(ad).status;
      acc[health] = (acc[health] || 0) + 1;
      return acc;
    },
    { running: 0, warning: 0, underperforming: 0, needs_review: 0 }
  );

  return counts;
}
