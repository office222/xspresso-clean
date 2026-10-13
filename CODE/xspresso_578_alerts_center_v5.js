export function evaluateAdHealth(ad = {}) {
  const cpcWarning = ad.cpc >= 1.5;
  const noConversions = (ad.conversions || 0) === 0 && (ad.clicks || 0) > 20;
  const lowCtr = (ad.ctr || 0) > 0 && ad.ctr < 0.8;

  if (noConversions || cpcWarning || lowCtr) {
    return {
      status: "warning",
      title: "This ad is underperforming.",
      message: "Improve it before spending more credits monitoring an ad that is not performing.",
      recommendation: "Regenerate this ad with a new title, hook, or angle."
    };
  }

  return {
    status: "healthy",
    title: "This ad is performing well.",
    message: "Keep monitoring and watch for changes.",
    recommendation: "Continue monitoring."
  };
}

export function buildAlert(ad = {}) {
  const health = evaluateAdHealth(ad);
  return {
    id: `alert_${Date.now()}`,
    campaignId: ad.campaignId || null,
    adId: ad.id || null,
    ...health,
    createdAt: new Date().toISOString()
  };
}
