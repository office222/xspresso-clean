// xspresso_491_campaign_builder_core_v3.js
// Core campaign builder scaffolding for Xspresso V1.

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || "Untitled Offer",
    productUrl: input.productUrl || "",
    productImage: input.productImage || "",
    offerDescription: input.offerDescription || "",
    audience: input.audience || "general audience",
    goal: input.goal || "sales",
    tone: input.tone || "simple",
    platforms: Array.isArray(input.platforms) ? input.platforms : [],
    templateType: input.templateType || "basic",
    notes: input.notes || ""
  };
}

export function applyCampaignDefaults(brief) {
  return {
    ...brief,
    goal: brief.goal || "sales",
    tone: brief.tone || "simple",
    platforms: brief.platforms && brief.platforms.length ? brief.platforms : ["general"],
    headlineStyle: brief.goal === "leads" ? "curiosity" : "benefit",
    callToAction: brief.goal === "sales" ? "Buy Now" : "Learn More",
    followUpEnabled: true,
    monitoringEnabled: true
  };
}

export function validateCampaignBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push("productName");
  if (!brief.offerDescription) missing.push("offerDescription");
  if (!brief.audience) missing.push("audience");

  return {
    valid: missing.length === 0,
    missing
  };
}

export function buildFallbackBrief() {
  return applyCampaignDefaults({
    productName: "Untitled Offer",
    offerDescription: "A product or service that needs a campaign.",
    audience: "general audience",
    goal: "sales",
    tone: "simple",
    platforms: ["general"],
    templateType: "basic",
    notes: "Fallback brief"
  });
}