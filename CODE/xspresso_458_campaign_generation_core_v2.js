/* Xspresso v2 - campaign generation core */

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
    headlineStyle: brief.goal === "leads" ? "curiosity" : "benefit"
  };
}

export function buildAiPrompt(brief) {
  return `Create a done-for-you marketing campaign for:\n\nProduct Name: ${brief.productName}\nProduct URL: ${brief.productUrl}\nOffer Description: ${brief.offerDescription}\nAudience: ${brief.audience}\nGoal: ${brief.goal}\nTone: ${brief.tone}\nPlatform: ${brief.platform}\nTemplate Type: ${brief.templateType}\nNotes: ${brief.notes}\n\nOutput headlines, hooks, ad copy, landing page copy, shopping cart copy, lead magnet copy, follow-up emails, and platform-specific versions. Keep it original, customer-focused, and easy to review.`;
}

export function buildCampaignOutput(brief, copy = {}, research = {}) {
  return {
    campaignId: `cmp_${Date.now()}`,
    status: "draft",
    generatedAt: new Date().toISOString(),
    brief,
    research,
    headline: copy.headline || "Wake up your marketing.",
    subheadline: copy.subheadline || "More responses. Less software chaos.",
    hooks: copy.hooks || [],
    ads: copy.ads || [],
    landingPage: copy.landingPage || {},
    shoppingCart: copy.shoppingCart || { enabled: true },
    leadMagnet: copy.leadMagnet || { enabled: brief.goal === "leads" },
    followUpEmails: copy.followUpEmails || [],
    platformVersions: copy.platformVersions || {},
    notes: ["Generated from brief", "Review before launch"]
  };
}
