export function buildCampaignBrief(formData = {}) {
  return {
    productName: formData.productName || "Untitled Offer",
    productUrl: formData.productUrl || "",
    productImage: formData.productImage || "",
    offerDescription: formData.offerDescription || "",
    audience: formData.audience || "general audience",
    goal: formData.goal || "sales",
    tone: formData.tone || "simple",
    platform: formData.platform || "general",
    templateType: formData.templateType || "basic",
    notes: formData.notes || ""
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

export function applyBriefDefaults(brief) {
  return {
    ...brief,
    callToAction: brief.goal === "sales" ? "Buy Now" : "Learn More",
    followUpEnabled: true,
    monitoringEnabled: true
  };
}
