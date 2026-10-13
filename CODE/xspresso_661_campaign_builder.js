window.XspressoCampaignBuilder = (() => {
  function normalize(str) {
    return String(str || "").trim();
  }

  function buildBrief(input = {}) {
    return {
      productName: normalize(input.productName) || "Untitled Offer",
      audience: normalize(input.audience) || "general audience",
      goal: normalize(input.goal) || "sales",
      tone: normalize(input.tone) || "simple",
      description: normalize(input.description) || "A product or offer that needs a campaign draft."
    };
  }

  function generateDraft(input = {}) {
    const brief = buildBrief(input);
    const headline = brief.goal === "leads"
      ? "Turn attention into leads."
      : "Done-for-you marketing that gets responses.";

    const subheadline = brief.tone === "premium"
      ? "Xspresso helps you launch a polished campaign faster."
      : "Build the draft, review it, and launch when you’re ready.";

    const body = `Product: ${brief.productName}. Audience: ${brief.audience}. Goal: ${brief.goal}. ${brief.description}`;

    return {
      brief,
      headline,
      subheadline,
      body,
      hooks: [
        "Wake up your marketing.",
        "You stay in command. We do the work.",
        "More responses. Less software chaos."
      ]
    };
  }

  function validateBrief(brief = {}) {
    const missing = [];
    if (!normalize(brief.productName)) missing.push("productName");
    if (!normalize(brief.audience)) missing.push("audience");
    if (!normalize(brief.goal)) missing.push("goal");
    return { valid: missing.length === 0, missing };
  }

  return { buildBrief, generateDraft, validateBrief };
})();
