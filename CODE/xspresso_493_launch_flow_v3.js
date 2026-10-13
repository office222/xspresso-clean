// xspresso_493_launch_flow_v3.js
// Launch readiness and launch flow scaffolding.

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];
  if (!campaign.headline) missing.push("headline");
  if (!campaign.landingPage) missing.push("landingPage");
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push("platformVersion");
  if (!campaign.followUpEnabled) missing.push("followUp");
  if (!campaign.creditsRemaining && campaign.creditsRemaining !== 0) missing.push("credits");

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchSummary(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    title: readiness.ready ? "Ready to Launch" : "Needs Review",
    message: readiness.ready
      ? "Xspresso has everything it needs. Review one last time, then launch."
      : `You still need: ${readiness.missing.join(", ")}`,
    ready: readiness.ready,
    missing: readiness.missing
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return {
      success: false,
      status: "blocked",
      missing: readiness.missing,
      message: "Campaign is not ready to launch."
    };
  }

  return {
    success: true,
    status: "live",
    launchedAt: new Date().toISOString(),
    message: "Campaign launched successfully."
  };
}