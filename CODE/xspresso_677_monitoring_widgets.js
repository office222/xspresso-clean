// xspresso_677_monitoring_widgets.js
// Ad health and monitoring helpers for Xspresso.

export function calculateAdHealth(ad) {
  const clicks = ad.clicks || 0;
  const conversions = ad.conversions || 0;
  const cpc = ad.cpc || 0;
  const ctr = ad.ctr || 0;

  const underperforming = (clicks > 20 && conversions === 0) || cpc > 1.5 || ctr < 0.8;

  if (underperforming) {
    return {
      status: 'underperforming',
      label: 'Needs attention',
      message: 'This ad is underperforming. Improve it before spending more credits monitoring an ad that is not performing.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.',
    };
  }

  return {
    status: 'healthy',
    label: 'Healthy',
    message: 'This ad is performing acceptably.',
    recommendation: 'Keep monitoring.',
  };
}

export function buildMonitoringSummary(ads = []) {
  const healthy = ads.filter((ad) => calculateAdHealth(ad).status === 'healthy').length;
  const flagged = ads.length - healthy;
  return {
    totalAds: ads.length,
    healthy,
    flagged,
    cpcWarningCount: ads.filter((ad) => (ad.cpc || 0) > 1.5).length,
    noConversionCount: ads.filter((ad) => (ad.clicks || 0) > 20 && (ad.conversions || 0) === 0).length,
  };
}

export function buildAlertFromAd(ad) {
  const health = calculateAdHealth(ad);
  if (health.status === 'healthy') return null;

  return {
    id: `alert_${Date.now()}`,
    campaignId: ad.campaignId || null,
    adId: ad.id || null,
    level: 'warning',
    title: 'Underperforming ad',
    message: health.message,
    action: health.recommendation,
    createdAt: new Date().toISOString(),
  };
}
