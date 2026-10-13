// xspresso_697_monitoring_engine_v10.js
// Ad monitoring and health rules for Xspresso

export const AdStatus = {
  RUNNING: 'running',
  WARNING: 'warning',
  UNDERPERFORMING: 'underperforming',
  NEEDS_REVIEW: 'needs_review'
};

export function evaluateAdHealth(ad = {}) {
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const clicks = Number(ad.clicks || 0);
  const conversions = Number(ad.conversions || 0);

  const poorCTR = ctr > 0 && ctr < 0.8;
  const highCPC = cpc > 1.5;
  const noConversions = conversions === 0 && clicks > 20;

  if (noConversions || highCPC || poorCTR) {
    return {
      status: AdStatus.UNDERPERFORMING,
      message: 'This ad is underperforming.',
      recommendation: 'Improve it before spending more credits monitoring an ad that is not performing.'
    };
  }

  if (cpc > 1.0 || ctr < 1.5) {
    return {
      status: AdStatus.WARNING,
      message: 'This ad may need a tweak.',
      recommendation: 'Try a new title, hook, or angle.'
    };
  }

  return {
    status: AdStatus.RUNNING,
    message: 'This ad is performing well.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildAlert(ad = {}) {
  const health = evaluateAdHealth(ad);
  return {
    id: `alert_${Date.now()}`,
    adId: ad.id || null,
    campaignId: ad.campaignId || null,
    level: health.status === AdStatus.UNDERPERFORMING ? 'critical' : 'warning',
    title: health.message,
    message: health.recommendation,
    createdAt: new Date().toISOString()
  };
}

export function getNextAction(ad = {}) {
  const health = evaluateAdHealth(ad);
  if (health.status === AdStatus.UNDERPERFORMING) {
    return {
      primaryAction: 'Regenerate this ad',
      secondaryActions: ['Rewrite the title', 'Test a new hook', 'Try a different angle', 'Change the CTA']
    };
  }

  if (health.status === AdStatus.WARNING) {
    return {
      primaryAction: 'Tweak this ad',
      secondaryActions: ['Lower CPC', 'Update creative', 'Test a new headline']
    };
  }

  return {
    primaryAction: 'Keep monitoring',
    secondaryActions: ['Review later', 'Pause if needed']
  };
}
