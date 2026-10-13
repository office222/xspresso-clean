// Xspresso launch readiness v2
// Checks whether a campaign is ready to go live.

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];

  if (!campaign.headline) missing.push("headline");
  if (!campaign.adCopy && !(campaign.ads && campaign.ads.length)) missing.push("ad copy");
  if (!campaign.landingPage) missing.push("landing page");
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push("platform version");
  if (!campaign.followUpEnabled) missing.push("follow-up");

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchMessage(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (readiness.ready) {
    return "Ready to launch. Review one last time, then go live.";
  }
  return `You still need: ${readiness.missing.join(", ")}`;
}
