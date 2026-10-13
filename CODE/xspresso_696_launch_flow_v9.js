// xspresso_696_launch_flow_v9.js
// Launch readiness and launch action helpers

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];

  if (!campaign.headline) missing.push('headline');
  if (!(campaign.ads?.length || campaign.adCopy)) missing.push('ad copy');
  if (!campaign.landingPage) missing.push('landing page');
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push('platform version');
  if (campaign.followUpEnabled === false) missing.push('follow-up');

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchWarning(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    title: readiness.ready ? 'Ready to launch?' : 'Missing items',
    message: readiness.ready
      ? 'Xspresso has everything it needs. Review one last time, then launch.'
      : `You still need: ${readiness.missing.join(', ')}`,
    action: readiness.ready ? 'Launch Campaign' : 'Fix Missing Items'
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return {
      success: false,
      status: 'blocked',
      missing: readiness.missing,
      message: 'Campaign is not ready to launch.'
    };
  }

  return {
    success: true,
    status: 'live',
    launchedAt: new Date().toISOString(),
    message: 'Campaign launched successfully.'
  };
}

export function markCampaignLive(campaign = {}) {
  return {
    ...campaign,
    status: 'live',
    launchedAt: new Date().toISOString(),
    monitoringEnabled: true
  };
}
