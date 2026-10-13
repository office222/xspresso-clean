// xspresso_528_monitoring_widget.js
// Monitoring widget helpers for Xspresso V1

export function evaluateAdHealth(ad) {
  const poorCtr = (ad.ctr || 0) < 0.8;
  const highCpc = (ad.cpc || 0) > 1.5;
  const noConversions = (ad.conversions || 0) === 0 && (ad.clicks || 0) > 20;

  if (noConversions || highCpc || poorCtr) {
    return {
      status: "underperforming",
      title: "This ad is underperforming.",
      message: "Improve it before spending more credits monitoring an ad that is not performing.",
      recommendation: "Regenerate this ad with a new title, hook, or angle.",
    };
  }

  return {
    status: "healthy",
    title: "This ad is performing well.",
    message: "Keep monitoring and watch for changes.",
    recommendation: "Keep monitoring.",
  };
}

export function buildAlert(ad) {
  const health = evaluateAdHealth(ad);
  return {
    adId: ad.id,
    name: ad.name,
    ...health,
  };
}

export function shouldWarnOnCpc(cpc, threshold = 1.5) {
  return cpc >= threshold;
}
