// xspresso_623_launch_flow_v4.js

export function checkLaunchReadiness(campaign) {
  const missing = [];
  if (!campaign?.headline) missing.push("headline");
  if (!campaign?.adCopy && !campaign?.ads?.length) missing.push("ad copy");
  if (!campaign?.landingPage) missing.push("landing page");
  if (!campaign?.platformVersions || Object.keys(campaign.platformVersions).length === 0) {
    missing.push("platform version");
  }
  return { ready: missing.length === 0, missing };
}

export function launchCampaign(campaign) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return { success: false, message: "Campaign is not ready to launch.", missing: readiness.missing };
  }
  return { success: true, status: "live", launchedAt: new Date().toISOString() };
}

export function buildLaunchWarning(campaign) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    title: "Ready to launch?",
    message: readiness.ready ? "Xspresso has everything it needs. You can launch now." : `You still need: ${readiness.missing.join(", ")}`,
    action: readiness.ready ? "Launch Campaign" : "Fix Missing Items",
  };
}
