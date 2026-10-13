/* Xspresso v2 - launch flow */

export function checkLaunchReadiness(campaign = {}) {
  const missing = [];

  if (!campaign.headline) missing.push("headline");
  if (!(campaign.ads && campaign.ads.length) && !campaign.adCopy) missing.push("ad copy");
  if (!campaign.landingPage) missing.push("landing page");
  if (!campaign.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push("platform version");
  if ((campaign.creditsRemaining || 0) <= 0) missing.push("credits");

  return {
    ready: missing.length === 0,
    missing
  };
}

export function buildLaunchWarning(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  return {
    title: "Ready to launch?",
    message: readiness.ready ? "Xspresso has everything it needs. You can launch now." : `You still need: ${readiness.missing.join(", ")}`,
    action: readiness.ready ? "Launch Campaign" : "Fix Missing Items"
  };
}

export function launchCampaign(campaign = {}) {
  const readiness = checkLaunchReadiness(campaign);
  if (!readiness.ready) {
    return { success: false, message: "Campaign is not ready to launch.", missing: readiness.missing };
  }
  return {
    success: true,
    status: "live",
    launchedAt: new Date().toISOString(),
    monitoringEnabled: true,
    message: "Campaign launched successfully."
  };
}

export function markAsLaunched(campaign = {}) {
  return {
    ...campaign,
    status: "live",
    launchedAt: new Date().toISOString(),
    monitoringEnabled: true
  };
}
