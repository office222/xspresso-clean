export function scoreCampaign(campaign = {}) {
  const cpc = Number(campaign.cpc || 0);
  const ctr = Number(campaign.ctr || 0);
  const conversions = Number(campaign.conversions || 0);
  const clicks = Number(campaign.clicks || 0);

  if (conversions === 0 && clicks > 20) {
    return {
      status: 'underperforming',
      level: 'critical',
      message: 'This ad is underperforming.',
      recommendation: 'Improve it before spending more credits monitoring an ad that is not performing.'
    };
  }

  if (cpc > 1.5) {
    return {
      status: 'warning',
      level: 'warning',
      message: 'CPC is rising.',
      recommendation: 'Try a new title, hook, or angle.'
    };
  }

  if (ctr && ctr < 0.8) {
    return {
      status: 'warning',
      level: 'warning',
      message: 'CTR is low.',
      recommendation: 'Test a stronger headline or hook.'
    };
  }

  return {
    status: 'healthy',
    level: 'ok',
    message: 'This campaign is performing acceptably.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildAlert(campaign = {}) {
  const health = scoreCampaign(campaign);
  return {
    id: `alert_${Date.now()}`,
    campaignId: campaign.id || null,
    title: health.message,
    message: health.recommendation,
    level: health.level,
    createdAt: new Date().toISOString()
  };
}

export function monitorCampaigns(campaigns = []) {
  const alerts = [];
  const statuses = [];
  campaigns.forEach(campaign => {
    const health = scoreCampaign(campaign);
    statuses.push({ id: campaign.id, name: campaign.name, health });
    if (health.level !== 'ok') alerts.push(buildAlert(campaign));
  });
  return { statuses, alerts };
}
