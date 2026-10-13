// xspresso_434_launch_flow.js
// Xspresso launch flow: validate readiness, launch, and hand off to monitoring.

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];

  if (!campaign.headline && !(campaign.headlines && campaign.headlines.length)) missing.push('headline');
  if (!campaign.adCopy && !(campaign.ads && campaign.ads.length)) missing.push('ad copy');
  if (!campaign.landingPage) missing.push('landing page');
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push('platform version');
  if (!campaign.followUpEnabled) missing.push('follow-up');
  if (Number(campaign.creditsRemaining || 0) <= 0) missing.push('credits');

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function buildLaunchPanel(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);

  return {
    title: readiness.ready ? 'Ready to launch' : 'Needs review',
    message: readiness.ready
      ? 'Xspresso has everything it needs. Review one last time, then launch.'
      : `You still need: ${readiness.missing.join(', ')}`,
    actionLabel: readiness.ready ? 'Launch Now' : 'Fix Missing Items',
    ready: readiness.ready,
    missing: readiness.missing,
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);

  if (!readiness.ready) {
    return {
      success: false,
      status: 'blocked',
      message: 'Campaign is not ready to launch.',
      missing: readiness.missing,
    };
  }

  return {
    success: true,
    status: 'live',
    message: 'Campaign launched successfully.',
    launchedAt: new Date().toISOString(),
    monitoringEnabled: true,
  };
}

export function postLaunchState(campaign = {}) {
  return {
    ...campaign,
    status: 'live',
    launchedAt: campaign.launchedAt || new Date().toISOString(),
    monitoringEnabled: true,
  };
}