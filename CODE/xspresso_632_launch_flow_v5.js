// xspresso_632_launch_flow_v5.js

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  if (!campaign.headline) missing.push('headline');
  if (!(campaign.landingPage || campaign.landingPageCopy)) missing.push('landing page');
  if (!(campaign.adCopy || (campaign.ads && campaign.ads.length))) missing.push('ad copy');
  if (!(campaign.platformVersions || {}).selected && !campaign.platform) missing.push('platform');

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function buildLaunchSummary(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    status: readiness.ready ? 'Ready to Launch' : 'Needs Review',
    message: readiness.ready
      ? 'Xspresso has everything it needs. Review one last time, then launch.'
      : `Missing items: ${readiness.missing.join(', ')}`,
    readiness,
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return { success: false, ...readiness };
  }

  return {
    success: true,
    status: 'live',
    launchedAt: new Date().toISOString(),
    message: 'Campaign launched successfully.',
  };
}
