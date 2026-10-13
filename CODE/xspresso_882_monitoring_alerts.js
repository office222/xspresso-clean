// xspresso_882_monitoring_alerts.js
export function evaluateCampaignHealth(campaign = {}) {
  const cpc = Number(campaign.cpc || 0);
  const ctr = Number(campaign.ctr || 0);
  const clicks = Number(campaign.clicks || 0);
  const conversions = Number(campaign.conversions || 0);

  const alerts = [];

  if (cpc >= 2.0) {
    alerts.push({
      level: 'critical',
      title: 'CPC is high',
      message: 'This ad may need a tweak before you spend more credits.',
      recommendation: 'Rewrite the title or test a different hook.'
    });
  } else if (cpc >= 1.5) {
    alerts.push({
      level: 'warning',
      title: 'CPC is rising',
      message: 'This ad is trending up in cost.',
      recommendation: 'Try a new angle or stronger CTA.'
    });
  }

  if (ctr > 0 && ctr < 0.8) {
    alerts.push({
      level: 'warning',
      title: 'CTR is low',
      message: 'This ad may need a new hook or headline.',
      recommendation: 'Regenerate the ad copy.'
    });
  }

  if (clicks >= 20 && conversions === 0) {
    alerts.push({
      level: 'critical',
      title: 'Underperforming ad',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: 'info',
      title: 'Campaign looks healthy',
      message: 'Keep monitoring and watch for changes.',
      recommendation: 'No action needed.'
    });
  }

  return alerts;
}

export function buildNotificationFromAlert(alert, campaignId) {
  return {
    id: `ntf_${Date.now()}`,
    campaignId,
    title: alert.title,
    message: alert.message,
    level: alert.level,
    action: alert.recommendation,
    createdAt: new Date().toISOString(),
    read: false
  };
}

export function buildMonitoringSummary(campaign = {}) {
  const alerts = evaluateCampaignHealth(campaign);
  const critical = alerts.filter(a => a.level === 'critical').length;
  const warning = alerts.filter(a => a.level === 'warning').length;

  return {
    campaignId: campaign.id || null,
    alerts,
    critical,
    warning,
    status: critical > 0 ? 'needs_attention' : warning > 0 ? 'watch' : 'healthy'
  };
}
