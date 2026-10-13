// xspresso_834_monitoring_engine.js
export function evaluateAdHealth(ad = {}) {
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const conversions = Number(ad.conversions || 0);
  const clicks = Number(ad.clicks || 0);

  const issues = [];
  if (cpc >= 1.5) issues.push("CPC is rising");
  if (ctr > 0 && ctr < 0.8) issues.push("CTR is low");
  if (conversions === 0 && clicks >= 20) issues.push("Clicks without conversions");

  const status = issues.length === 0 ? "healthy" : issues.length === 1 ? "warning" : "critical";

  return {
    status,
    issues,
    recommendation:
      status === "healthy"
        ? "Keep monitoring."
        : "Regenerate with a new title, hook, or angle before spending more credits."
  };
}

export function buildAlert(ad, health = evaluateAdHealth(ad)) {
  return {
    id: `alert_${Date.now()}`,
    campaignId: ad.campaignId || null,
    adId: ad.id || null,
    title: health.status === "healthy" ? "Campaign looks good" : "Campaign needs attention",
    message:
      health.status === "healthy"
        ? "This ad is performing well."
        : `This ad is ${health.status}. ${health.issues.join(", ")}.`,
    level: health.status === "critical" ? "critical" : health.status === "warning" ? "warning" : "info",
    recommendation: health.recommendation,
    createdAt: new Date().toISOString()
  };
}

export function buildMonitoringSummary(campaigns = []) {
  return campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    health: evaluateAdHealth(campaign),
    monitoringStatus: campaign.monitoringStatus || "active"
  }));
}

export function shouldNotify(health) {
  return health.status !== "healthy";
}
