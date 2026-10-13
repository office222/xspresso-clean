// xspresso_636_launch_flow_v6.js
// Launch readiness and launch flow helpers for Xspresso

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  if (!campaign.headline) missing.push('headline');
  if (!(campaign.ads && campaign.ads.length) && !campaign.adCopy) missing.push('ad copy');
  if (!campaign.landingPage) missing.push('landing page');
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push('platform version');
  if (!campaign.followUpEnabled) missing.push('follow-up');

  return {
    ready: missing.length === 0,
    missing
  };
}

export function launchCampaign(campaign) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return {
      success: false,
      status: 'needs_review',
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
