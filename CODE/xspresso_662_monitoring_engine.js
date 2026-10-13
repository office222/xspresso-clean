window.XspressoMonitoringEngine = (() => {
  function evaluateAd(ad = {}) {
    const cpc = Number(ad.cpc || 0);
    const ctr = Number(ad.ctr || 0);
    const conversions = Number(ad.conversions || 0);
    const clicks = Number(ad.clicks || 0);

    if (conversions > 0 && cpc <= 1.5 && ctr >= 0.8) {
      return {
        status: "healthy",
        message: "This ad is performing well.",
        action: "Keep monitoring."
      };
    }

    if (conversions === 0 && clicks > 20) {
      return {
        status: "underperforming",
        message: "This ad is underperforming.",
        action: "Regenerate this ad with a new title, hook, or angle."
      };
    }

    if (cpc > 2.0 || ctr < 0.5) {
      return {
        status: "warning",
        message: "This ad may need a tweak.",
        action: "Try a new headline, hook, or CTA."
      };
    }

    return {
      status: "watch",
      message: "This ad should keep being monitored.",
      action: "Continue watching."
    };
  }

  function buildAlert(ad = {}) {
    const result = evaluateAd(ad);
    return {
      id: `alert_${Date.now()}`,
      title: ad.name || "Campaign alert",
      level: result.status,
      message: result.message,
      recommendation: result.action,
      createdAt: new Date().toISOString()
    };
  }

  function evaluateCampaign(campaign = {}) {
    const alerts = [];
    if ((campaign.creditsRemaining || 0) < 100) {
      alerts.push({
        title: "Low credits",
        level: "warning",
        message: "You have fewer than 100 credits remaining.",
        recommendation: "Review usage or add credits."
      });
    }
    (campaign.ads || []).forEach(ad => {
      const alert = buildAlert(ad);
      if (alert.level !== "healthy") alerts.push(alert);
    });
    return alerts;
  }

  return { evaluateAd, buildAlert, evaluateCampaign };
})();
