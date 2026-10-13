export function checkLaunchReadiness(campaign = {}) {
  const missing = [];

  if (!campaign.headline) missing.push('headline');
  if (!campaign.adCopy && !(campaign.ads && campaign.ads.length)) missing.push('adCopy');
  if (!campaign.landingPage || Object.keys(campaign.landingPage).length === 0) missing.push('landingPage');
  if (!campaign.followUpEmails || !campaign.followUpEmails.length) missing.push('followUpEmails');
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push('platformVersions');

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchSummary(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    campaignName: campaign.name || 'Untitled Campaign',
    status: readiness.ready ? 'ready' : 'needs_review',
    missing: readiness.missing,
    creditsRequired: campaign.creditsRequired || 0,
    launchEnabled: readiness.ready && (campaign.creditsRemaining ?? 1) > 0
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return { success: false, message: 'Campaign is not ready to launch.', missing: readiness.missing };
  }
  if ((campaign.creditsRemaining ?? 0) <= 0) {
    return { success: false, message: 'Not enough credits to launch.', missing: ['credits'] };
  }
  return {
    success: true,
    message: 'Campaign launched successfully.',
    launchedAt: new Date().toISOString(),
    status: 'live'
  };
}
