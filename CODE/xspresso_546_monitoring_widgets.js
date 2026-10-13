// xspresso_546_monitoring_widgets.js
// Monitoring widgets and ad health helpers for Xspresso

export function getAdHealth(ad = {}) {
  const poorCTR = (ad.ctr ?? 0) < 0.8;
  const highCPC = (ad.cpc ?? 0) > 1.5;
  const noConversions = (ad.conversions ?? 0) === 0 && (ad.clicks ?? 0) > 20;

  if (noConversions || highCPC || poorCTR) {
    return {
      status: 'underperforming',
      message: 'This ad is underperforming.',
      recommendation: 'Improve it before spending more credits monitoring an ad that is not performing.',
      nextAction: 'Regenerate this ad with a new title, hook, or angle.',
    };
  }

  return {
    status: 'healthy',
    message: 'This ad is performing acceptably.',
    recommendation: 'Keep monitoring.',
    nextAction: 'Continue watching performance.',
  };
}

export function buildAlert(ad = {}) {
  const health = getAdHealth(ad);
  return {
    id: `alt_${Date.now()}`,
    adId: ad.id || null,
    campaignId: ad.campaignId || null,
    title: health.status === 'underperforming' ? 'Underperforming ad' : 'Ad update',
    message: health.message,
    level: health.status === 'underperforming' ? 'critical' : 'info',
    recommendation: health.recommendation,
    action: health.nextAction,
    createdAt: new Date().toISOString(),
  };
}

export function evaluateCampaignForAlerts(campaign = {}) {
  const alerts = [];
  if ((campaign.cpc ?? 0) > 1.5) {
    alerts.push({ title: 'CPC is rising', message: 'This ad may need a tweak before you spend more credits.', level: 'warning' });
  }
  if ((campaign.conversions ?? 0) === 0 && (campaign.clicks ?? 0) > 20) {
    alerts.push({ title: 'Underperforming ad', message: 'Improve it before spending more credits monitoring an ad that is not performing.', level: 'critical' });
  }
  if ((campaign.ctr ?? 0) < 0.8) {
    alerts.push({ title: 'CTR is low', message: 'Try a new title, hook, or angle.', level: 'warning' });
  }
  return alerts;
}

export function buildMonitoringSummary(campaigns = []) {
  const alerts = campaigns.flatMap(evaluateCampaignForAlerts);
  return {
    totalMonitored: campaigns.length,
    alertCount: alerts.length,
    alerts,
  };
}
