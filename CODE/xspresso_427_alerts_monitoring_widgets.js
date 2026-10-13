// xspresso_427_alerts_monitoring_widgets.js
// Monitoring widgets and alert helpers for Xspresso

export const AlertLevel = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
};

export function buildAlertCard(alert) {
  return {
    id: alert.id,
    campaignId: alert.campaignId || null,
    adId: alert.adId || null,
    level: alert.level || AlertLevel.WARNING,
    title: alert.title || "Attention needed",
    message: alert.message || "Review this item.",
    action: alert.action || "Review",
    createdAt: alert.createdAt || new Date().toISOString(),
  };
}

export function evaluateCampaignMetrics(campaign) {
  const alerts = [];

  const cpcWarning = campaign.cpc > 1.5;
  const ctrWarning = typeof campaign.ctr === "number" && campaign.ctr < 0.8;
  const noConversions = (campaign.conversions || 0) === 0 && (campaign.clicks || 0) > 20;

  if (cpcWarning) {
    alerts.push(buildAlertCard({
      campaignId: campaign.id,
      level: AlertLevel.WARNING,
      title: "CPC is rising",
      message: "This campaign may need a tweak before more credits are spent.",
      action: "Try a new headline or hook",
    }));
  }

  if (ctrWarning) {
    alerts.push(buildAlertCard({
      campaignId: campaign.id,
      level: AlertLevel.WARNING,
      title: "CTR is low",
      message: "Try a different title, hook, or angle.",
      action: "Regenerate headline",
    }));
  }

  if (noConversions) {
    alerts.push(buildAlertCard({
      campaignId: campaign.id,
      level: AlertLevel.CRITICAL,
      title: "Underperforming ad",
      message: "Improve it before spending more credits monitoring an ad that is not performing.",
      action: "Regenerate this ad",
    }));
  }

  return alerts;
}

export function alertsSummary(alerts = []) {
  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.level === AlertLevel.CRITICAL).length,
    warning: alerts.filter((a) => a.level === AlertLevel.WARNING).length,
    info: alerts.filter((a) => a.level === AlertLevel.INFO).length,
  };
}

export function buildMonitoringWidget(campaign) {
  const alerts = evaluateCampaignMetrics(campaign);
  const summary = alertsSummary(alerts);

  return {
    campaignId: campaign.id,
    title: campaign.name || "Untitled Campaign",
    cpc: campaign.cpc || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    alerts,
    summary,
    nextAction: alerts[0]?.action || "Keep monitoring",
  };
}
