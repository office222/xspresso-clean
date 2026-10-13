// xspresso_415_launch_screen.js
// Launch readiness and launch flow helpers for Xspresso V1

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];

  if (!campaign.headline) missing.push('headline');
  if (!(campaign.adCopy || (campaign.ads && campaign.ads.length))) missing.push('ad copy');
  if (!campaign.landingPage) missing.push('landing page');
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push('platform version');
  if (!campaign.followUpEnabled && !(campaign.followUpEmails && campaign.followUpEmails.length)) missing.push('follow-up');
  if (campaign.creditsAvailable === 0) missing.push('credits');

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function buildLaunchState(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    campaignId: campaign.id || null,
    readiness,
    status: readiness.ready ? 'ready_to_launch' : 'needs_review',
    message: readiness.ready
      ? 'Xspresso has everything it needs. Review one last time, then launch.'
      : `You still need: ${readiness.missing.join(', ')}`,
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
    launchedAt: new Date().toISOString(),
    message: 'Campaign launched successfully.',
  };
}

export function postLaunchMonitoringState(campaign = {}) {
  return {
    campaignId: campaign.id || null,
    status: 'monitoring',
    nextAction: 'Watch CPC, CTR, conversions, and alerts',
    monitoringEnabled: true,
  };
}

export default {
  checkLaunchReadiness,
  buildLaunchState,
  launchCampaign,
  postLaunchMonitoringState,
};
