export function createAlert({ campaignId = null, adId = null, title = '', message = '', level = 'warning' } = {}) {
  return {
    id: `alert_${Date.now()}`,
    campaignId,
    adId,
    title,
    message,
    level,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

export function evaluateCampaignAlerts(campaign = {}) {
  const alerts = [];
  const cpc = campaign.cpc ?? 0;
  const ctr = campaign.ctr ?? 0;
  const clicks = campaign.clicks ?? 0;
  const conversions = campaign.conversions ?? 0;

  if (cpc >= 1.5) {
    alerts.push(createAlert({
      campaignId: campaign.id,
      title: 'CPC is rising',
      message: 'This campaign may need a tweak before you spend more credits.',
      level: 'warning'
    }));
  }

  if (conversions === 0 && clicks > 20) {
    alerts.push(createAlert({
      campaignId: campaign.id,
      title: 'Underperforming ad',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      level: 'critical'
    }));
  }

  if (ctr < 0.8 && clicks > 10) {
    alerts.push(createAlert({
      campaignId: campaign.id,
      title: 'CTR is low',
      message: 'Try a new title, hook, or angle.',
      level: 'warning'
    }));
  }

  return alerts;
}

export function resolveAlert(alert = {}) {
  return { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() };
}