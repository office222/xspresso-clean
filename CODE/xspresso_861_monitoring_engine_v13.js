const DEFAULT_THRESHOLDS = {
  cpcWarning: 1.5,
  cpcCritical: 2.25,
  ctrWarning: 0.8,
  ctrCritical: 0.5,
};

export function evaluateAd(ad, thresholds = DEFAULT_THRESHOLDS) {
  const result = {
    status: 'healthy',
    level: 'info',
    title: 'Ad is performing well',
    message: 'Keep monitoring and watch for changes.',
    recommendation: 'Continue monitoring',
  };

  if ((ad.conversions || 0) === 0 && (ad.clicks || 0) >= 20) {
    result.status = 'underperforming';
    result.level = 'critical';
    result.title = 'This ad is underperforming';
    result.message = 'Improve it before spending more credits monitoring an ad that is not performing.';
    result.recommendation = 'Regenerate with a new title, hook, or angle.';
    return result;
  }

  if ((ad.cpc || 0) >= thresholds.cpcCritical) {
    result.status = 'critical';
    result.level = 'critical';
    result.title = 'CPC is too high';
    result.message = 'This ad may need a stronger hook or a lower-cost angle.';
    result.recommendation = 'Try a new title or hook.';
    return result;
  }

  if ((ad.cpc || 0) >= thresholds.cpcWarning) {
    result.status = 'warning';
    result.level = 'warning';
    result.title = 'CPC is rising';
    result.message = 'This ad may need a tweak before more credits are spent.';
    result.recommendation = 'Test a new CTA or hook.';
    return result;
  }

  if ((ad.ctr || 0) > 0 && (ad.ctr || 0) <= thresholds.ctrCritical) {
    result.status = 'warning';
    result.level = 'warning';
    result.title = 'CTR is low';
    result.message = 'The creative may need a sharper hook.';
    result.recommendation = 'Regenerate the headline and hook.';
    return result;
  }

  return result;
}

export function buildAlert(ad, evaluation) {
  return {
    id: `${ad.id || 'ad'}-${Date.now()}`,
    campaignId: ad.campaignId || null,
    adId: ad.id || null,
    level: evaluation.level,
    title: evaluation.title,
    message: evaluation.message,
    recommendation: evaluation.recommendation,
    createdAt: new Date().toISOString(),
  };
}
