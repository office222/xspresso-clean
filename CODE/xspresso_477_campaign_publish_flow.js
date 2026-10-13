// xspresso_477_campaign_publish_flow.js
// Campaign publish flow for Xspresso V1

export function checkPublishReadiness(campaign) {
  const missing = [];
  if (!campaign) missing.push('campaign');
  if (!campaign?.headline) missing.push('headline');
  if (!campaign?.adCopy?.length && !campaign?.ads?.length) missing.push('ad copy');
  if (!campaign?.landingPage) missing.push('landing page');
  if (!campaign?.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push('platform version');

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function publishCampaign(campaign) {
  const readiness = checkPublishReadiness(campaign);
  if (!readiness.ready) {
    return {
      success: false,
      status: 'needs_review',
      message: 'Campaign is not ready to publish.',
      missing: readiness.missing,
    };
  }

  return {
    success: true,
    status: 'published',
    publishedAt: new Date().toISOString(),
    message: 'Campaign published successfully.',
  };
}

export function buildPublishSummary(campaign) {
  const readiness = checkPublishReadiness(campaign);
  return {
    title: campaign?.name || 'Untitled Campaign',
    ready: readiness.ready,
    missing: readiness.missing,
    nextAction: readiness.ready ? 'Publish now' : 'Fix missing items',
  };
}
