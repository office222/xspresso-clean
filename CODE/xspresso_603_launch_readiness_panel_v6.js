export function checkLaunchReadiness(campaign = {}) {
  const missing = [];

  if (!campaign.headline) missing.push('headline');
  if (!campaign.ads || campaign.ads.length === 0) missing.push('ad copy');
  if (!campaign.landingPage) missing.push('landing page');
  if (!campaign.followUpEnabled) missing.push('follow-up');
  if (!campaign.platformVersion) missing.push('platform version');

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchSummary(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    title: readiness.ready ? 'Ready to Launch' : 'Needs Review',
    status: readiness.ready ? 'ready' : 'blocked',
    missing: readiness.missing,
    creditsRequired: campaign.creditsRequired || 0,
    creditsAvailable: campaign.creditsAvailable || 0
  };
}
