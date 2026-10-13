// xspresso_689_launch_flow_v8.js
// Launch readiness + launch execution helpers for Xspresso.

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  if (!campaign.headline) missing.push("headline");
  if (!campaign.adCopy?.length) missing.push("ad copy");
  if (!campaign.landingPage) missing.push("landing page");
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push("platform version");
  if (!campaign.followUpEmails?.length) missing.push("follow-up emails");

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchWarning(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    title: readiness.ready ? "Ready to launch?" : "Campaign needs attention",
    message: readiness.ready
      ? "Xspresso has everything it needs. Review one last time, then launch."
      : `You still need: ${readiness.missing.join(", ")}`,
    action: readiness.ready ? "Launch Campaign" : "Fix Missing Items"
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return {
      success: false,
      status: "blocked",
      message: "Campaign is not ready to launch.",
      missing: readiness.missing
    };
  }

  return {
    success: true,
    status: "live",
    launchedAt: new Date().toISOString(),
    message: "Campaign launched successfully."
  };
}

export function postLaunchState(campaign = {}) {
  return {
    ...campaign,
    monitoringEnabled: true,
    launchedAt: campaign.launchedAt || new Date().toISOString(),
    status: "live"
  };
}
