// xspresso_452_alerts_monitoring_widgets.js
// Alerts and monitoring widgets for Xspresso

export function buildAlertWidget(alert) {
  return {
    id: alert.id || `alert_${Date.now()}`,
    title: alert.title || 'Attention needed',
    message: alert.message || 'This campaign may need review.',
    level: alert.level || 'warning',
    status: alert.status || 'open',
    createdAt: alert.createdAt || new Date().toISOString(),
  };
}

export function buildMonitoringWidget(campaign) {
  return {
    campaignId: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    cpc: campaign.cpc ?? 0,
    ctr: campaign.ctr ?? 0,
    conversions: campaign.conversions ?? 0,
    monitoredAds: campaign.monitoredAds ?? 0,
    status: campaign.status || 'monitoring',
  };
}

export function getMonitoringState(campaign) {
  const cpc = campaign.cpc ?? 0;
  const ctr = campaign.ctr ?? 0;
  const conversions = campaign.conversions ?? 0;

  if (conversions === 0 && campaign.clicks > 20) {
    return {
      state: 'underperforming',
      message: 'This ad is underperforming. Improve it before spending more credits.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.',
    };
  }

  if (cpc >= 1.5) {
    return {
      state: 'warning',
      message: 'CPC is rising. This ad may need a tweak.',
      recommendation: 'Try a new headline or hook.',
    };
  }

  if (ctr < 0.8) {
    return {
      state: 'warning',
      message: 'CTR is low. Consider a new creative angle.',
      recommendation: 'Test a stronger hook.',
    };
  }

  return {
    state: 'healthy',
    message: 'This campaign is performing acceptably.',
    recommendation: 'Keep monitoring.',
  };
}
