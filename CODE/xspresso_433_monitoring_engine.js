// xspresso_433_monitoring_engine.js
// Xspresso monitoring engine: evaluate campaigns, detect issues, and suggest actions.

export const AlertLevel = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

export function createAlert({ campaignId = null, adId = null, title, message, level = AlertLevel.WARNING, action = null }) {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    campaignId,
    adId,
    title,
    message,
    level,
    action,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}

export function evaluateAdPerformance(ad = {}) {
  const clicks = Number(ad.clicks || 0);
  const conversions = Number(ad.conversions || 0);
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);

  const alerts = [];

  if (clicks > 20 && conversions === 0) {
    alerts.push(createAlert({
      campaignId: ad.campaignId || null,
      adId: ad.id || null,
      title: 'Underperforming ad',
      message: 'This ad is underperforming. Improve it before spending more credits monitoring an ad that is not performing.',
      level: AlertLevel.CRITICAL,
      action: 'Regenerate this ad with a new title, hook, or angle.',
    }));
  }

  if (cpc >= 1.5) {
    alerts.push(createAlert({
      campaignId: ad.campaignId || null,
      adId: ad.id || null,
      title: 'CPC is rising',
      message: 'CPC is rising. This ad may need a tweak before you spend more credits.',
      level: AlertLevel.WARNING,
      action: 'Try a new headline or different angle.',
    }));
  }

  if (ctr > 0 && ctr < 0.8) {
    alerts.push(createAlert({
      campaignId: ad.campaignId || null,
      adId: ad.id || null,
      title: 'CTR is low',
      message: 'CTR is low. Xspresso recommends testing a new hook or title.',
      level: AlertLevel.WARNING,
      action: 'Rewrite the hook or title.',
    }));
  }

  if (alerts.length === 0) {
    alerts.push(createAlert({
      campaignId: ad.campaignId || null,
      adId: ad.id || null,
      title: 'Ad is healthy',
      message: 'This ad is performing acceptably. Keep monitoring.',
      level: AlertLevel.INFO,
      action: 'Keep watching.',
    }));
  }

  return alerts;
}

export function buildMonitoringSummary(campaigns = []) {
  const allAlerts = campaigns.flatMap((campaign) =>
    (campaign.ads || []).flatMap((ad) => evaluateAdPerformance({ ...ad, campaignId: campaign.id }))
  );

  return {
    totalCampaigns: campaigns.length,
    totalAlerts: allAlerts.length,
    criticalAlerts: allAlerts.filter((a) => a.level === AlertLevel.CRITICAL).length,
    warningAlerts: allAlerts.filter((a) => a.level === AlertLevel.WARNING).length,
    infoAlerts: allAlerts.filter((a) => a.level === AlertLevel.INFO).length,
    alerts: allAlerts,
  };
}

export function recommendNextStep(alert) {
  switch (alert?.title) {
    case 'Underperforming ad':
      return 'Regenerate this ad with a new title, hook, or angle.';
    case 'CPC is rising':
      return 'Test a stronger headline or a different creative angle.';
    case 'CTR is low':
      return 'Try a new hook, title, or offer framing.';
    default:
      return 'Keep monitoring and review again later.';
  }
}