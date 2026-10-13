// xspresso_553_launch_flow.js
// Launch readiness and publish flow for Xspresso V1.

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  const sections = campaign.sections || {};

  if (!campaign.productName) missing.push('product name');
  if (!sections.headline) missing.push('headline');
  if (!sections.adCopy || (Array.isArray(sections.adCopy) && sections.adCopy.length === 0)) missing.push('ad copy');
  if (!sections.landingPage) missing.push('landing page');
  if (!sections.followUpEmails || sections.followUpEmails.length === 0) missing.push('follow-up');
  if (!Array.isArray(campaign.platforms) || campaign.platforms.length === 0) missing.push('platform');

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchSummary(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    campaignId: campaign.id || null,
    ready: readiness.ready,
    missing: readiness.missing,
    message: readiness.ready
      ? 'Ready to launch.'
      : `Needs review: ${readiness.missing.join(', ')}`,
    launchedAt: readiness.ready ? new Date().toISOString() : null
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return {
      success: false,
      status: 'not_ready',
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