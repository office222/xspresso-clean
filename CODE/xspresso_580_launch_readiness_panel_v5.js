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

export function buildLaunchStatus(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return readiness.ready
    ? { status: "ready", message: "You’re ready to go live." }
    : { status: "needs_review", message: `You still need: ${readiness.missing.join(", ")}` };
}
