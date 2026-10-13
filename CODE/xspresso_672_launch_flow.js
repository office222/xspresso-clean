// xspresso_672_launch_flow.js
// Launch readiness and publish flow for Xspresso.

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  if (!campaign.headline) missing.push('headline');
  if (!campaign.landingPage) missing.push('landingPage');
  if (!(campaign.ads?.length || campaign.adCopy)) missing.push('adCopy');
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push('platformVersion');
  if (campaign.followUpEnabled === false) missing.push('followUp');

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchMessage(campaign) {
  const readiness = checkLaunchReadiness(campaign);
  if (readiness.ready) {
    return 'Xspresso has everything it needs. Review one last time, then launch.';
  }
  return `You are almost ready. Missing: ${readiness.missing.join(', ')}`;
}

export function launchCampaign(campaign) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return { success: false, status: 'blocked', missing: readiness.missing };
  }
  return {
    success: true,
    status: 'live',
    launchedAt: new Date().toISOString(),
    monitoringEnabled: true
  };
}
