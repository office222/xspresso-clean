// xspresso_428_launch_readiness_panel.js
// Launch readiness checks and panel data for Xspresso

export function checkLaunchReadiness(campaign) {
  const missing = [];

  if (!campaign.headline) missing.push("headline");
  if (!campaign.adCopy && !(campaign.ads && campaign.ads.length)) missing.push("ad copy");
  if (!campaign.landingPage) missing.push("landing page");
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push("platform version");
  if (!campaign.followUpEnabled) missing.push("follow-up");

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function buildLaunchPanel(campaign) {
  const readiness = checkLaunchReadiness(campaign);

  return {
    campaignId: campaign.id,
    title: campaign.name || "Launch Campaign",
    status: readiness.ready ? "Ready to Launch" : "Needs Review",
    message: readiness.ready
      ? "Xspresso has everything it needs. Review one last time, then launch."
      : `You still need: ${readiness.missing.join(", ")}`,
    missing: readiness.missing,
    actions: readiness.ready
      ? ["Launch Now", "Save Draft", "Back to Review"]
      : ["Fix Missing Items", "Save Draft", "Back to Review"],
  };
}

export function launchCampaign(campaign) {
  const readiness = checkLaunchReadiness(campaign);

  if (!readiness.ready) {
    return {
      success: false,
      status: "blocked",
      missing: readiness.missing,
      message: "Campaign is not ready to launch.",
    };
  }

  return {
    success: true,
    status: "live",
    launchedAt: new Date().toISOString(),
    monitoringEnabled: true,
    message: "Campaign launched successfully.",
  };
}
