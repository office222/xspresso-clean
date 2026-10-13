// xspresso_656_launch_flow_v7.js
// Launch readiness and launch flow

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  if (!campaign.headline) missing.push('headline');
  if (!campaign.ads?.length) missing.push('ad copy');
  if (!campaign.landingPage) missing.push('landing page');
  if (!campaign.followUp?.length) missing.push('follow-up');
  if (!campaign.platform) missing.push('platform');

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchStatus(campaign) {
  const readiness = checkLaunchReadiness(campaign);
  return readiness.ready
    ? { status: 'ready', label: 'Ready to Launch', message: 'Xspresso has everything it needs.' }
    : { status: 'needs-review', label: 'Needs Review', message: `Missing: ${readiness.missing.join(', ')}` };
}

export function launchCampaign(campaign) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return {
      success: false,
      message: 'Campaign is not ready to launch.',
      missing: readiness.missing
    };
  }

  return {
    success: true,
    status: 'live',
    launchedAt: new Date().toISOString(),
    message: 'Campaign launched successfully.'
  };
}

export function buildLaunchCopy(campaign) {
  const readiness = checkLaunchReadiness(campaign);
  return readiness.ready
    ? 'You are ready to go live. Review one last time, then launch.'
    : `You still need to fix: ${readiness.missing.join(', ')}`;
}
