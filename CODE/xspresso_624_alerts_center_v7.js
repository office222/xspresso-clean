// xspresso_624_alerts_center_v7.js

export const AlertLevel = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
};

export function buildAlert({ campaignId = null, adId = null, title, message, level = AlertLevel.WARNING }) {
  return {
    id: `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    campaignId,
    adId,
    title,
    message,
    level,
    status: "open",
    createdAt: new Date().toISOString(),
  };
}

export function evaluateAdHealth(ad = {}) {
  const poorCTR = (ad.ctr ?? 0) < 0.8;
  const highCPC = (ad.cpc ?? 0) > 1.5;
  const noConversions = (ad.conversions ?? 0) === 0 && (ad.clicks ?? 0) > 20;

  if (noConversions || highCPC || poorCTR) {
    return {
      status: "underperforming",
      message: "This ad is underperforming.",
      recommendation: "Improve it before spending more credits monitoring an ad that is not performing.",
    };
  }

  return {
    status: "healthy",
    message: "This ad is performing acceptably.",
    recommendation: "Keep monitoring.",
  };
}
