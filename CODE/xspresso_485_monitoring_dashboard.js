// xspresso_485_monitoring_dashboard.js
// Monitoring helpers and dashboard summary for Xspresso V1

export function getCampaignHealth(campaign = {}) {
  const cpc = Number(campaign.cpc || 0);
  const ctr = Number(campaign.ctr || 0);
  const conversions = Number(campaign.conversions || 0);
  const clicks = Number(campaign.clicks || 0);

  if (conversions === 0 && clicks > 20) {
    return {
      level: "critical",
      title: "This ad is underperforming.",
      message: "Improve it before spending more credits monitoring an ad that is not performing.",
      recommendation: "Regenerate this ad with a new title, hook, or angle.",
    };
  }

  if (cpc > 1.5 || ctr < 0.8) {
    return {
      level: "warning",
      title: "This campaign may need a tweak.",
      message: "Xspresso recommends reviewing the title, hook, or CTA.",
      recommendation: "Test a new headline or angle.",
    };
  }

  return {
    level: "good",
    title: "This campaign is performing well.",
    message: "Keep monitoring and continue what is working.",
    recommendation: "Keep monitoring.",
  };
}

export function buildDashboardSummary({ campaigns = [], creditsRemaining = 0, alerts = [] } = {}) {
  const activeCampaigns = campaigns.filter((c) => c.status === "live").length;
  const drafts = campaigns.filter((c) => c.status === "draft").length;
  const monitoredAds = campaigns.reduce((sum, c) => sum + Number(c.monitoredAds || 0), 0);

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    drafts,
    monitoredAds,
    alerts: alerts.length,
    creditsRemaining,
    recentCampaigns: campaigns.slice(0, 5),
    recentAlerts: alerts.slice(0, 5),
  };
}

export function evaluateCampaignAlerts(campaign = {}) {
  const alerts = [];
  const health = getCampaignHealth(campaign);

  if (health.level !== "good") {
    alerts.push({
      campaignId: campaign.id || null,
      level: health.level,
      title: health.title,
      message: health.message,
      recommendation: health.recommendation,
      createdAt: new Date().toISOString(),
    });
  }

  if (Number(campaign.creditsUsed || 0) > Number(campaign.creditsBudget || 0)) {
    alerts.push({
      campaignId: campaign.id || null,
      level: "warning",
      title: "Credits are running high.",
      message: "Review usage before spending more credits.",
      recommendation: "Consider regenerating only the section that needs help.",
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}
