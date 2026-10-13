// xspresso_591_launch_flow.js
// Launch readiness and launch helpers.

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  if (!campaign.headline) missing.push('headline');
  if (!campaign.landingPage) missing.push('landingPage');
  if (!campaign.followUpEmails || !campaign.followUpEmails.length) missing.push('followUpEmails');
  if (!campaign.platformVersions || !Object.keys(campaign.platformVersions).length) missing.push('platformVersion');
  return { ready: missing.length === 0, missing };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return { success: false, message: 'Campaign is not ready to launch.', missing: readiness.missing };
  }
  return {
    success: true,
    status: 'live',
    launchedAt: new Date().toISOString(),
    message: 'Campaign launched successfully.'
  };
}

export function launchHint() {
  return 'You cannot launch blind. Xspresso will show what is missing before you go live.';
}