// xspresso_821_monitoring_alerts_panel_v4.js
// Monitoring / alerts panel helpers for Xspresso

export function evaluateAdHealth(ad = {}) {
  const alerts = [];

  if ((ad.conversions || 0) === 0 && (ad.clicks || 0) > 20) {
    alerts.push({
      level: "critical",
      title: "Underperforming ad",
      message: "This ad is underperforming. Improve it before spending more credits.",
      action: "Regenerate this ad with a new title, hook, or angle.",
    });
  }

  if ((ad.cpc || 0) > 1.5) {
    alerts.push({
      level: "warning",
      title: "CPC is rising",
      message: "This ad may need a tweak before you spend more credits.",
      action: "Test a new headline or hook.",
    });
  }

  if ((ad.ctr || 0) < 0.8) {
    alerts.push({
      level: "warning",
      title: "CTR is low",
      message: "Try a stronger hook, headline, or angle.",
      action: "Regenerate the title or hook.",
    });
  }

  return alerts;
}

export function buildAlertsPanel(alerts = []) {
  return alerts.map((alert, index) => ({
    id: alert.id || `alert_${index}`,
    level: alert.level || "info",
    title: alert.title,
    message: alert.message,
    action: alert.action || "Review this item.",
  }));
}
