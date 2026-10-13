// Xspresso V1 - Campaign Generation Engine
// This file holds the core flow for turning an offer into a campaign draft.

const defaultCopy = {
  headline: "Done-for-you marketing that gets responses.",
  subheadline: "More responses. Less software chaos.",
  cta: "Try the Demo"
};

function buildCampaignInput(data = {}) {
  return {
    productName: data.productName || "Untitled Offer",
    productUrl: data.productUrl || "",
    productImage: data.productImage || "",
    offerDescription: data.offerDescription || "",
    audience: data.audience || "general audience",
    goal: data.goal || "sales",
    tone: data.tone || "simple",
    platforms: Array.isArray(data.platforms) ? data.platforms : [],
    notes: data.notes || ""
  };
}

function researchCampaign(input) {
  // Placeholder for future research logic.
  // This can later connect to competitors, matching products, and audience signals.
  return {
    matchingProducts: [],
    competingOffers: [],
    audienceSignals: [],
    angleSuggestions: []
  };
}

function generateCampaignCopy(input, research) {
  return {
    headlines: [
      defaultCopy.headline,
      "Wake up your marketing.",
      "You stay in command. We do the work."
    ],
    hooks: [
      "Turn one offer into a full campaign faster.",
      "Let Xspresso do the heavy lifting.",
      "Build smarter without software chaos."
    ],
    adCopy: [
      "Xspresso helps you turn an offer into ads, landing pages, and follow-up faster.",
      "Done-for-you marketing that saves time and reduces software chaos."
    ],
    landingPage: {
      headline: defaultCopy.headline,
      subheadline: defaultCopy.subheadline,
      body: "Turn your product details into a campaign you can launch faster."
    },
    cartCopy: {
      headline: "Simple checkout",
      body: "Get the offer while it is available."
    },
    leadMagnet: {
      enabled: input.goal === "leads",
      headline: "Grab your free guide",
      body: "Build trust and capture leads."
    },
    followUp: [
      "Thanks for checking this out.",
      "Here’s a quick reminder about the offer.",
      "You may want to take another look before it’s gone."
    ],
    researchSummary: research
  };
}

function adaptForPlatform(copy, platform) {
  const isVertical = /tiktok|reels|shorts/i.test(platform);

  return {
    platform,
    format: isVertical ? "vertical" : "square",
    headline: copy.headlines[0],
    body: copy.adCopy[0],
    cta: defaultCopy.cta,
    notes: `Adjusted for ${platform}`
  };
}

function buildPlatformVersions(copy, platforms = []) {
  const versions = {};
  platforms.forEach((platform) => {
    versions[platform] = adaptForPlatform(copy, platform);
  });
  return versions;
}

function buildCampaign(data = {}) {
  const input = buildCampaignInput(data);
  const research = researchCampaign(input);
  const copy = generateCampaignCopy(input, research);
  const platformVersions = buildPlatformVersions(copy, input.platforms);

  return {
    input,
    research,
    copy,
    platformVersions,
    status: "draft",
    createdAt: new Date().toISOString()
  };
}

function createFallbackCampaign() {
  return buildCampaign({
    productName: "Untitled Offer",
    offerDescription: "A product or offer needing a campaign",
    audience: "general audience",
    goal: "sales",
    tone: "simple",
    platforms: ["Facebook", "TikTok"]
  });
}

module.exports = {
  buildCampaignInput,
  researchCampaign,
  generateCampaignCopy,
  adaptForPlatform,
  buildPlatformVersions,
  buildCampaign,
  createFallbackCampaign
};
