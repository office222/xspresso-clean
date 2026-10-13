// Xspresso launch readiness
// File: xspresso_572_launch_readiness_v4.js

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];

  if (!campaign.headline) missing.push('headline');
  if (!campaign.adCopy && !(campaign.ads || []).length) missing.push('ad copy');
  if (!campaign.landingPage) missing.push('landing page');
  if (!campaign.followUpEnabled) missing.push('follow-up');
  if (!(campaign.platformVersions || Object.keys(campaign.platformVersions || {}).length)) missing.push('platform version');
  if ((campaign.creditsRemaining ?? 0) <= 0) missing.push('credits');

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function buildLaunchPanel(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    title: readiness.ready ? 'Ready to launch' : 'Needs review',
    status: readiness.ready ? 'ready' : 'blocked',
    message: readiness.ready
      ? 'Xspresso has everything it needs. Review one last time, then launch.'
      : `Missing: ${readiness.missing.join(', ')}`,
    action: readiness.ready ? 'Launch Now' : 'Fix Missing Items',
    missing: readiness.missing,
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return { success: false, status: 'blocked', missing: readiness.missing };
  }

  return {
    success: true,
    status: 'live',
    launchedAt: new Date().toISOString(),
    message: 'Campaign launched successfully.',
  };
}