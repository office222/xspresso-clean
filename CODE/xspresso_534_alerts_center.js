// Xspresso alerts center

export const AlertLevel = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
};

export function buildAlert({ campaignId = null, adId = null, title = "", message = "", level = AlertLevel.WARNING } = {}) {
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
  const poorCtr = (ad.ctr || 0) < 0.8;
  const highCpc = (ad.cpc || 0) > 1.5;
  const noConversions = (ad.conversions || 0) === 0 && (ad.clicks || 0) > 20;

  if (noConversions || highCpc || poorCtr) {
    return buildAlert({
      campaignId: ad.campaignId,
      adId: ad.id,
      title: "This ad is underperforming.",
      message: "Improve it before spending more credits monitoring an ad that is not performing.",
      level: AlertLevel.CRITICAL,
    });
  }

  if ((ad.cpc || 0) > 1.25) {
    return buildAlert({
      campaignId: ad.campaignId,
      adId: ad.id,
      title: "CPC is rising.",
      message: "This ad may need a tweak before you spend more credits.",
      level: AlertLevel.WARNING,
    });
  }

  return buildAlert({
    campaignId: ad.campaignId,
    adId: ad.id,
    title: "Monitoring looks good.",
    message: "This ad is performing within expectations.",
    level: AlertLevel.INFO,
  });
}

export function buildNotificationAction(alert) {
  if (alert.title.includes("underperforming")) {
    return "Regenerate this ad with a new title, hook, or angle.";
  }
  if (alert.title.includes("CPC is rising")) {
    return "Try a new headline or a different angle.";
  }
  return "Review this campaign.";
}
