// xspresso_832_campaign_builder.js
const DEFAULT_HEADLINES = [
  "Wake up your marketing.",
  "Done-for-you marketing that gets responses.",
  "More responses. Less software chaos."
];

function pickTone(tone = "simple") {
  const map = {
    simple: "clear, concise, and practical",
    friendly: "warm, clear, and helpful",
    bold: "confident, punchy, and direct",
    premium: "polished, calm, and high-value",
    direct: "straight to the point",
    persuasive: "benefit-driven and action-oriented"
  };
  return map[tone] || map.simple;
}

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName?.trim() || "Untitled Offer",
    productUrl: input.productUrl?.trim() || "",
    productImage: input.productImage?.trim() || "",
    offerDescription: input.offerDescription?.trim() || "A product or offer that needs a campaign.",
    audience: input.audience?.trim() || "general audience",
    goal: input.goal || "sales",
    tone: input.tone || "simple",
    platform: input.platform || "general",
    notes: input.notes?.trim() || "",
    templateType: input.templateType || "basic"
  };
}

export function generateCampaignDraft(brief, research = {}) {
  const tone = pickTone(brief.tone);
  const headline = DEFAULT_HEADLINES[0];
  const subheadline = "You stay in command. We do the work.";
  const hooks = [
    `Built for ${brief.audience} who want ${brief.goal} without the usual chaos.`,
    `Xspresso turns one offer into a complete marketing draft.`,
    `Do less setup. Get more responses.`
  ];

  return {
    brief,
    research,
    tone,
    headlines: DEFAULT_HEADLINES,
    hooks,
    ads: [
      {
        platform: brief.platform,
        headline,
        body: `${brief.productName} made simple with done-for-you marketing that gets responses.`,
        cta: brief.goal === "leads" ? "Learn More" : "Try the Demo"
      }
    ],
    landingPage: {
      headline,
      subheadline,
      bullets: [
        "Done-for-you campaigns",
        "Built to keep you in command",
        "Monitoring that helps, not hassles"
      ]
    },
    followUpEmails: [
      {
        day: 0,
        subject: `Thanks for checking out ${brief.productName}`,
        body: "Here’s a quick reminder of the offer and why it matters."
      },
      {
        day: 2,
        subject: "A quick follow-up",
        body: "Just checking in with a simple reminder and a next step."
      }
    ]
  };
}

export function adaptForPlatform(draft, platform) {
  return {
    ...draft,
    ads: draft.ads.map((ad) => ({
      ...ad,
      platform,
      format: platform === "TikTok" ? "vertical" : "square"
    }))
  };
}

export function summarizeBrief(brief) {
  return `${brief.productName} | ${brief.goal} | ${brief.tone} | ${brief.platform}`;
}
