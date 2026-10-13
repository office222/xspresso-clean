// Xspresso campaign builder v2
// Builds a structured campaign draft from a simple brief.

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
    notes: input.notes || ""
  };
}

export function applySmartDefaults(brief) {
  return {
    ...brief,
    callToAction: brief.goal === "leads" ? "Learn More" : "Buy Now",
    followUpEnabled: true,
    monitoringEnabled: true,
    approvedSections: []
  };
}

export function validateBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push("productName");
  if (!brief.offerDescription) missing.push("offerDescription");
  if (!brief.audience) missing.push("audience");
  return { valid: missing.length === 0, missing };
}
