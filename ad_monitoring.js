// Xspresso V1 - Ad Monitoring Engine
// Tracks ad performance, flags issues, and suggests next actions.

const AdStatus = {
  RUNNING: "running",
  PAUSED: "paused",
  WARNING: "warning",
  UNDERPERFORMING: "underperforming",
  NEEDS_REVIEW: "needs_review"
};

const AlertLevel = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical"
};

/**
 * Basic ad record.
 */
function createAdRecord({
  id,
  name,
  platform,
  cpc = 0,
  ctr = 0,
  clicks = 0,
  impressions = 0,
  conversions = 0,
  monitoringPlan = "daily",
  monitoringCreditsPerDay = 5
}) {
  return {
    id,
    name,
    platform,
    cpc,
    ctr,
    clicks,
    impressions,
    conversions,
    monitoringPlan,
    monitoringCreditsPerDay,
    status: AdStatus.RUNNING,
    lastCheckedAt: new Date().toISOString()
  };
}

/**
 * Evaluate ad performance and return status + recommendation.
 */
function evaluateAdPerformance(ad) {
  const poorCTR = ad.ctr < 0.8;
  const highCPC = ad.cpc > 1.5;
  const noConversions = ad.conversions === 0 && ad.clicks > 20;

  if (noConversions || highCPC || poorCTR) {
    return {
      status: AdStatus.UNDERPERFORMING,
      title: "This ad is underperforming.",
      message: "Improve it before spending more credits monitoring an ad that is not performing.",
      recommendation: "Let Xspresso regenerate this ad with a new title, hook, or angle."
    };
  }

  if (ad.cpc > 1.25 || ad.ctr < 1.0) {
    return {
      status: AdStatus.WARNING,
      title: "This ad may need a tweak.",
      message: "CPC is rising or CTR is dropping.",
      recommendation: "Try a new headline, hook, or angle."
    };
  }

  return {
    status: AdStatus.RUNNING,
    title: "This ad is performing well.",
    message: "Keep monitoring and watch for changes.",
    recommendation: "Continue tracking this ad."
  };
}

/**
 * Build a user-facing alert message.
 */
function buildAdAlert(ad) {
  const result = evaluateAdPerformance(ad);

  return {
    adId: ad.id,
    adName: ad.name,
    platform: ad.platform,
    level: result.status === AdStatus.UNDERPERFORMING ? AlertLevel.CRITICAL : AlertLevel.WARNING,
    title: result.title,
    message: result.message,
    recommendation: result.recommendation,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Suggest the next best action based on ad health.
 */
function suggestNextAction(ad) {
  const result = evaluateAdPerformance(ad);

  if (result.status === AdStatus.UNDERPERFORMING) {
    return {
      primaryAction: "Regenerate this ad",
      secondaryActions: [
        "Rewrite the title",
        "Test a new hook",
        "Try a different angle",
        "Change the CTA",
        "Pause monitoring"
      ]
    };
  }

  if (result.status === AdStatus.WARNING) {
    return {
      primaryAction: "Tweak this ad",
      secondaryActions: [
        "Test a new headline",
        "Update creative",
        "Adjust the offer angle"
      ]
    };
  }

  return {
    primaryAction: "Keep monitoring",
    secondaryActions: [
      "Review later",
      "Pause if needed"
    ]
  };
}

/**
 * Generate a one-click regeneration request.
 */
function regenerateAd(ad, options = {}) {
  return {
    originalAdId: ad.id,
    status: "regenerating",
    changesRequested: {
      title: options.title !== false,
      hook: options.hook !== false,
      angle: options.angle !== false,
      cta: options.cta !== false
    },
    requestAt: new Date().toISOString(),
    message: "Xspresso is regenerating this ad with a new title, hook, or angle."
  };
}

/**
 * Build a monitoring cost estimate.
 */
function calculateMonitoringCost({ count = 1, ratePerDay = 5, term = "daily" }) {
  if (term === "daily") return count * ratePerDay;
  if (term === "weekly") return count * ratePerDay * 7;
  if (term === "monthly") return count * ratePerDay * 30;
  return 0;
}

/**
 * Create a platform switch warning.
 */
function buildPlatformSwitchWarning(platformName, ads = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: "Choose which ads you want Xspresso to keep tracking, or choose the option that fits your ads best.",
    platform: platformName,
    adCount: ads.length,
    options: [
      "Keep running all ads — I will track them myself",
      `Delete all ads from ${platformName} and move them to my library`,
      `Keep monitoring all ads on ${platformName} for a usage cost`,
      "I will monitor them myself"
    ]
  };
}

/**
 * Export helpers.
 */
module.exports = {
  AdStatus,
  AlertLevel,
  createAdRecord,
  evaluateAdPerformance,
  buildAdAlert,
  suggestNextAction,
  regenerateAd,
  calculateMonitoringCost,
  buildPlatformSwitchWarning
};
