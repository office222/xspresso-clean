// Xspresso launch flow v10

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  if (!campaign.brief?.productName && !campaign.productName) missing.push('product name');
  if (!campaign.headline && !campaign.headlines?.length) missing.push('headline');
  if (!campaign.adCopy?.length) missing.push('ad copy');
  if (!campaign.landingPage?.headline) missing.push('landing page');
  if (!campaign.followUpEmails?.length) missing.push('follow-up');
  if (!campaign.platforms?.length && !campaign.platformVersion) missing.push('platform selection');
  if ((campaign.creditsRemaining ?? 0) <= 0) missing.push('credits');

  return { ready: missing.length === 0, missing };
}

export function buildLaunchWarning(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    title: readiness.ready ? 'Ready to launch?' : 'Needs attention before launch',
    message: readiness.ready
      ? 'Xspresso has everything it needs. Review one last time, then launch.'
      : `You still need: ${readiness.missing.join(', ')}.`,
    action: readiness.ready ? 'Launch Now' : 'Fix Missing Items',
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
    monitoringEnabled: true,
  };
}

export function markCampaignLaunched(campaign = {}) {
  return {
    ...campaign,
    status: 'live',
    launchedAt: new Date().toISOString(),
    monitoringEnabled: true,
  };
}
