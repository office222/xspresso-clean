// xspresso_453_launch_readiness_panel.js
// Launch readiness panel for Xspresso

export function checkLaunchReadiness(campaign) {
  const missing = [];

  if (!campaign.headline) missing.push('headline');
  if (!campaign.adCopy && !(campaign.ads && campaign.ads.length)) missing.push('ad copy');
  if (!campaign.landingPage) missing.push('landing page');
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push('platform version');
  if (!campaign.followUpEnabled) missing.push('follow-up sequence');

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function buildLaunchPanel(campaign) {
  const readiness = checkLaunchReadiness(campaign);

  return {
    title: 'Ready to launch?',
    ready: readiness.ready,
    missing: readiness.missing,
    message: readiness.ready
      ? 'Xspresso has everything it needs. Review one last time, then launch.'
      : `You still need: ${readiness.missing.join(', ')}`,
    primaryAction: readiness.ready ? 'Launch Now' : 'Fix Missing Items',
    secondaryActions: ['Save Draft', 'Back to Review'],
  };
}

export function launchCampaign(campaign) {
  const readiness = checkLaunchReadiness(campaign);

  if (!readiness.ready) {
    return {
      success: false,
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
