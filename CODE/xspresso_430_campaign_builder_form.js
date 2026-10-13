// xspresso_430_campaign_builder_form.js
// Campaign builder form helpers for Xspresso

export const toneOptions = ["simple", "friendly", "bold", "premium", "direct", "persuasive"];
export const goalOptions = ["get clicks", "get leads", "get sales", "build a list", "follow up automatically", "improve an existing campaign"];
export const platformOptions = ["Facebook", "Instagram", "TikTok", "YouTube", "Google", "Other"];

export function createCampaignBrief(input = {}) {
  return {
    productName: input.productName || "Untitled Offer",
    productPhoto: input.productPhoto || "",
    productUrl: input.productUrl || "",
    offerDescription: input.offerDescription || "A product or offer needing a campaign.",
    audience: input.audience || "general audience",
    goal: input.goal || "get sales",
    tone: input.tone || "simple",
    platform: input.platform || "general",
    templateType: input.templateType || "basic",
    notes: input.notes || "",
  };
}

export function validateCampaignBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push("productName");
  if (!brief.offerDescription) missing.push("offerDescription");
  if (!brief.audience) missing.push("audience");
  return { valid: missing.length === 0, missing };
}

export function buildPromptFromBrief(brief) {
  return [
    `Create a done-for-you marketing campaign for: ${brief.productName}`,
    `Offer description: ${brief.offerDescription}`,
    `Audience: ${brief.audience}`,
    `Goal: ${brief.goal}`,
    `Tone: ${brief.tone}`,
    `Platform: ${brief.platform}`,
    `Template type: ${brief.templateType}`,
    `Notes: ${brief.notes}`,
    "Output headlines, hooks, ad copy, landing page copy, lead magnet copy, and follow-up emails.",
    "Keep it original, customer-focused, and easy to review.",
  ].join("\n");
}

export function buildCampaignFormState(input = {}) {
  const brief = createCampaignBrief(input);
  const validation = validateCampaignBrief(brief);

  return {
    brief,
    validation,
    toneOptions,
    goalOptions,
    platformOptions,
    canGenerate: validation.valid,
    helperText: validation.valid
      ? "Ready to generate a draft."
      : "Fill in the missing fields and Xspresso can still help.",
  };
}
