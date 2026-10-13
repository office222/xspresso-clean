// xspresso_687_campaign_builder_form_v6.js
// Campaign builder form helpers for Xspresso.

export const TONES = ["simple", "friendly", "bold", "premium", "direct", "persuasive"];
export const GOALS = ["clicks", "leads", "sales", "list_building", "follow_up", "improve_campaign"];

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || "Untitled Offer",
    productUrl: input.productUrl || "",
    productImage: input.productImage || "",
    offerDescription: input.offerDescription || "A product or offer needing a campaign.",
    audience: input.audience || "general audience",
    goal: GOALS.includes(input.goal) ? input.goal : "sales",
    tone: TONES.includes(input.tone) ? input.tone : "simple",
    platform: input.platform || "general",
    templateType: input.templateType || "basic",
    notes: input.notes || ""
  };
}

export function validateCampaignBrief(brief = {}) {
  const missing = [];
  if (!brief.productName) missing.push("productName");
  if (!brief.offerDescription) missing.push("offerDescription");
  if (!brief.audience) missing.push("audience");

  return {
    valid: missing.length === 0,
    missing
  };
}

export function getSmartDefaults(input = {}) {
  return {
    ...buildCampaignBrief(input),
    headlineStyle: input.goal === "leads" ? "curiosity" : "benefit",
    callToAction: input.goal === "sales" ? "Buy Now" : "Learn More",
    followUpEnabled: true,
    monitoringEnabled: true
  };
}

export function briefToPrompt(brief) {
  return `
Create a done-for-you marketing campaign for the following offer:

Product Name: ${brief.productName}
Product URL: ${brief.productUrl}
Offer Description: ${brief.offerDescription}
Audience: ${brief.audience}
Goal: ${brief.goal}
Tone: ${brief.tone}
Platform: ${brief.platform}
Template Type: ${brief.templateType}
Notes: ${brief.notes}

Output:
- headlines
- hooks
- ad copy
- landing page copy
- shopping cart copy
- lead magnet copy
- follow-up emails
- platform-specific version

Keep it original, customer-focused, and aligned with the user's goal.
`.trim();
}
