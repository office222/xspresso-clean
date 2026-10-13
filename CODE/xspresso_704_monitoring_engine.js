export function getAdHealth(ad = {}) {
  const cpc = Number(ad.cpc ?? 1.42);
  const ctr = Number(ad.ctr ?? 0.8);
  const clicks = Number(ad.clicks ?? 0);
  const conversions = Number(ad.conversions ?? 0);

  const poorCtr = ctr < 0.8;
  const highCpc = cpc > 1.5;
  const noConversions = conversions === 0 && clicks > 20;

  if (noConversions || highCpc || poorCtr) {
    return {
      status: 'underperforming',
      message: 'This ad is underperforming. Improve it before spending more credits monitoring an ad that is not performing.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    };
  }

  return {
    status: 'healthy',
    message: 'This ad is performing acceptably.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildAlert(ad = {}) {
  const health = getAdHealth(ad);
  return {
    id: `alt_${Date.now()}`,
    campaignId: ad.campaignId || null,
    adId: ad.id || null,
    title: ad.name || 'Campaign Alert',
    level: health.status === 'underperforming' ? 'critical' : 'info',
    message: health.message,
    recommendation: health.recommendation,
    createdAt: new Date().toISOString(),
    status: 'open'
  };
}

export function getMonitoringCost(term = 'daily', creditRate = 5) {
  if (term === 'daily') return creditRate;
  if (term === 'weekly') return creditRate * 7;
  if (term === 'monthly') return creditRate * 30;
  return 0;
}

export function evaluateCampaignForAlerts(campaign = {}) {
  const alerts = [];
  if ((campaign.cpc ?? 0) > 1.5) alerts.push(buildAlert({ ...campaign, name: 'CPC rising' }));
  if ((campaign.ctr ?? 1) < 0.8) alerts.push(buildAlert({ ...campaign, name: 'CTR low' }));
  if ((campaign.conversions ?? 0) === 0 && (campaign.clicks ?? 0) > 20) alerts.push(buildAlert({ ...campaign, name: 'No conversions' }));
  return alerts;
}

export function buildPlatformSwitchWarning(platformName, adList = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: 'Choose what you want to do with each ad.',
    options: [
      'Keep running all ads — I will track them myself',
      `Delete all ads from ${platformName} and move them to my library`,
      `Keep monitoring all ads on ${platformName} for a usage cost`,
      'I will monitor them myself'
    ],
    adList
  };
}
