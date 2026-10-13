// xspresso_484_campaign_api.js
// Core campaign data helpers for Xspresso V1

export function createCampaignDraft(input = {}) {
  return {
    id: input.id || `cmp_${Date.now()}`,
    name: input.name || "Untitled Campaign",
    productName: input.productName || "",
    productUrl: input.productUrl || "",
    productImage: input.productImage || "",
    offerDescription: input.offerDescription || "",
    audience: input.audience || "general audience",
    goal: input.goal || "sales",
    tone: input.tone || "simple",
    platform: input.platform || "general",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function validateCampaignDraft(campaign) {
  const missing = [];
  if (!campaign?.productName) missing.push("productName");
  if (!campaign?.offerDescription) missing.push("offerDescription");
  if (!campaign?.audience) missing.push("audience");

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function buildCampaignBrief(input = {}) {
  const draft = createCampaignDraft(input);
  const validation = validateCampaignDraft(draft);

  return {
    ...draft,
    validation,
    brief: {
      product: draft.productName,
      audience: draft.audience,
      goal: draft.goal,
      tone: draft.tone,
      platform: draft.platform,
    },
  };
}

export function updateCampaignSection(campaign, sectionName, value) {
  return {
    ...campaign,
    [sectionName]: value,
    updatedAt: new Date().toISOString(),
  };
}

export function markCampaignStatus(campaign, status) {
  return {
    ...campaign,
    status,
    updatedAt: new Date().toISOString(),
  };
}
