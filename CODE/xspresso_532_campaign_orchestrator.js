// Xspresso campaign orchestrator
// Coordinates brief -> generation -> review -> launch readiness -> monitoring hooks.

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || "Untitled Offer",
    productUrl: input.productUrl || "",
    productImage: input.productImage || "",
    offerDescription: input.offerDescription || "A product or offer needing a campaign",
    audience: input.audience || "general audience",
    goal: input.goal || "sales",
    tone: input.tone || "simple",
    platform: input.platform || "general",
    templateType: input.templateType || "basic",
    notes: input.notes || "",
  };
}

export function isCampaignReady(campaign) {
  const missing = [];
  if (!campaign?.headline) missing.push("headline");
  if (!campaign?.landingPage) missing.push("landing page");
  if (!campaign?.platformVersions || Object.keys(campaign.platformVersions).length === 0) missing.push("platform version");
  if (!campaign?.followUpEmails || campaign.followUpEmails.length === 0) missing.push("follow-up emails");
  return { ready: missing.length === 0, missing };
}

export function orchestrateCampaignFlow(input, generators = {}) {
  const brief = buildCampaignBrief(input);
  const research = typeof generators.research === "function" ? generators.research(brief) : {};
  const copy = typeof generators.copy === "function" ? generators.copy(brief, research) : {};
  const output = typeof generators.output === "function" ? generators.output(brief, research, copy) : { brief, research, copy };

  return {
    brief,
    research,
    copy,
    output,
    readiness: isCampaignReady(output),
  };
}

export function recommendNextAction(campaign) {
  const readiness = isCampaignReady(campaign);
  if (!readiness.ready) {
    return {
      status: "needs_attention",
      message: `Missing: ${readiness.missing.join(", ")}`,
      action: "fix_missing_items",
    };
  }
  return {
    status: "ready",
    message: "Campaign is ready to launch.",
    action: "launch_now",
  };
}
