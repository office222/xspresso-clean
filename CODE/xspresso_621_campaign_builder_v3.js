// xspresso_621_campaign_builder_v3.js

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || "Untitled Offer",
    productUrl: input.productUrl || "",
    productImage: input.productImage || "",
    offerDescription: input.offerDescription || "",
    audience: input.audience || "general audience",
    goal: input.goal || "sales",
    tone: input.tone || "simple",
    platform: input.platform || "general",
    templateType: input.templateType || "basic",
    notes: input.notes || "",
  };
}

export function applyCampaignDefaults(brief) {
  return {
    ...brief,
    headlineStyle: brief.goal === "leads" ? "curiosity" : "benefit",
    callToAction: brief.goal === "sales" ? "Buy Now" : "Learn More",
    followUpEnabled: true,
    monitoringEnabled: true,
  };
}

export function validateCampaignBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push("productName");
  if (!brief.offerDescription) missing.push("offerDescription");
  if (!brief.audience) missing.push("audience");

  return {
    valid: missing.length === 0,
    missing,
  };
}
