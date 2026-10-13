/* Xspresso v2 - monitoring engine */

export const AdStatus = {
  RUNNING: "running",
  PAUSED: "paused",
  WARNING: "warning",
  UNDERPERFORMING: "underperforming",
  NEEDS_REVIEW: "needs_review"
};

export function evaluateAdPerformance(ad = {}) {
  const poorCTR = (ad.ctr || 0) < 0.8;
  const highCPC = (ad.cpc || 0) > 1.5;
  const noConversions = (ad.conversions || 0) === 0 && (ad.clicks || 0) > 20;

  if (noConversions || highCPC || poorCTR) {
    return {
      status: AdStatus.UNDERPERFORMING,
      message: "This ad is underperforming.",
      recommendation: "Improve it before spending more credits monitoring an ad that is not performing."
    };
  }

  return {
    status: AdStatus.RUNNING,
    message: "This ad is performing acceptably.",
    recommendation: "Keep monitoring."
  };
}

export function suggestAdFix(ad = {}) {
  const health = evaluateAdPerformance(ad);

  if (health.status === AdStatus.UNDERPERFORMING) {
    return {
      warning: health.message,
      action: health.recommendation,
      buttons: ["Regenerate this ad", "Rewrite the title", "Test a new hook", "Try a different angle", "Change the CTA"]
    };
  }

  return {
    warning: "No immediate changes needed.",
    action: "Keep monitoring.",
    buttons: ["Keep watching", "Review later"]
  };
}

export function buildAlertFeed(alerts = []) {
  return alerts.map(alert => ({
    id: alert.id || `alt_${Date.now()}`,
    title: alert.title || "Campaign alert",
    message: alert.message || "",
    level: alert.level || "warning",
    status: alert.status || "open",
    action: alert.action || "Review this campaign."
  }));
}

export function buildMonitoringSummary(campaigns = []) {
  return campaigns.map(c => {
    const state = evaluateAdPerformance(c);
    return {
      id: c.id,
      name: c.name || "Untitled campaign",
      cpc: c.cpc || 0,
      ctr: c.ctr || 0,
      conversions: c.conversions || 0,
      status: state.status,
      message: state.message
    };
  });
}
