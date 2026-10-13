// xspresso_547_launch_readiness_panel.js
// Launch readiness checks for Xspresso

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  if (!campaign.headline) missing.push('headline');
  if (!campaign.adCopy && !(campaign.ads && campaign.ads.length)) missing.push('ad copy');
  if (!campaign.landingPage) missing.push('landing page');
  if (!campaign.followUpEnabled) missing.push('follow-up');
  if (!campaign.platformVersion && !(campaign.platformVersions && Object.keys(campaign.platformVersions).length)) missing.push('platform version');
  if ((campaign.creditsRemaining ?? 1) <= 0) missing.push('credits');

  return {
    ready: missing.length === 0,
    missing,
    status: missing.length === 0 ? 'Ready to Launch' : 'Needs Review',
  };
}

export function buildLaunchWarning(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    title: readiness.ready ? 'Ready to launch?' : 'Needs attention before launch',
    message: readiness.ready
      ? 'Xspresso has everything it needs. Review one last time, then launch.'
      : `You still need: ${readiness.missing.join(', ')}`,
    action: readiness.ready ? 'Launch Campaign' : 'Fix Missing Items',
    readiness,
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return { success: false, message: 'Campaign is not ready to launch.', missing: readiness.missing };
  }
  return { success: true, status: 'live', launchedAt: new Date().toISOString(), message: 'Campaign launched successfully.' };
}
