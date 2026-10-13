// Xspresso V1 - Lead Capture and Follow-Up Engine
// This file defines simple structures and helper functions for turning leads
// into tagged contacts and placing them into the right follow-up sequence.

const leadStatus = {
  NEW: "new",
  WARM: "warm",
  HOT: "hot",
  CUSTOMER: "customer"
};

const leadActions = {
  OPENED_EMAIL: "opened_email",
  CLICKED_LINK: "clicked_link",
  REPLIED: "replied",
  VISITED_OFFER: "visited_offer",
  PURCHASED: "purchased"
};

function createLead(input = {}) {
  return {
    id: input.id || `lead_${Date.now()}`,
    name: input.name || "",
    email: input.email || "",
    phone: input.phone || "",
    sourceCampaign: input.sourceCampaign || "",
    sourcePlatform: input.sourcePlatform || "",
    tags: Array.isArray(input.tags) ? input.tags : [],
    status: input.status || leadStatus.NEW,
    score: typeof input.score === "number" ? input.score : 0,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString()
  };
}

function tagLead(lead, tag) {
  const tags = Array.isArray(lead.tags) ? [...lead.tags] : [];
  if (tag && !tags.includes(tag)) tags.push(tag);
  return {
    ...lead,
    tags,
    updatedAt: new Date().toISOString()
  };
}

function updateLeadScore(lead, action) {
  let score = typeof lead.score === "number" ? lead.score : 0;
  let status = lead.status || leadStatus.NEW;

  switch (action) {
    case leadActions.OPENED_EMAIL:
      score += 5;
      break;
    case leadActions.CLICKED_LINK:
      score += 10;
      break;
    case leadActions.REPLIED:
      score += 15;
      break;
    case leadActions.VISITED_OFFER:
      score += 12;
      break;
    case leadActions.PURCHASED:
      score += 50;
      status = leadStatus.CUSTOMER;
      break;
    default:
      break;
  }

  return {
    ...lead,
    score,
    status,
    updatedAt: new Date().toISOString()
  };
}

function classifyLead(lead) {
  const score = typeof lead.score === "number" ? lead.score : 0;

  if (lead.status === leadStatus.CUSTOMER) return leadStatus.CUSTOMER;
  if (score >= 50) return leadStatus.HOT;
  if (score >= 20) return leadStatus.WARM;
  return leadStatus.NEW;
}

function routeLeadToList(lead) {
  const group = classifyLead(lead);

  switch (group) {
    case leadStatus.HOT:
      return "hot-leads-list";
    case leadStatus.WARM:
      return "warm-leads-list";
    case leadStatus.CUSTOMER:
      return "customers-list";
    default:
      return "new-leads-list";
  }
}

function getFollowUpBranch(lead) {
  const group = classifyLead(lead);

  if (group === leadStatus.HOT) return "sales-sequence";
  if (group === leadStatus.WARM) return "nurture-sequence";
  if (group === leadStatus.CUSTOMER) return "customer-care-sequence";
  return "standard-follow-up";
}

function buildWelcomeEmail(offer = {}) {
  return {
    day: 0,
    type: "welcome",
    subject: `Thanks for checking out ${offer.name || "this offer"}`,
    body: offer.welcomeBody || "Thanks for your interest. Here's a quick introduction to the offer."
  };
}

function buildReminderEmail(offer = {}) {
  return {
    day: 1,
    type: "reminder",
    subject: offer.reminderSubject || "A quick reminder",
    body: offer.reminderBody || "You may want to take another look before you decide."
  };
}

function buildBenefitEmail(offer = {}) {
  return {
    day: 3,
    type: "benefit",
    subject: offer.benefitSubject || "Why this may be worth a second look",
    body: offer.benefitBody || "Here are a few reasons this offer may be useful for you."
  };
}

function buildOfferEmail(offer = {}) {
  return {
    day: 5,
    type: "offer",
    subject: offer.offerSubject || "Don’t miss this",
    body: offer.offerBody || "If you're interested, this is a good time to take a closer look."
  };
}

function buildFollowUpSequence(offer = {}) {
  return [
    buildWelcomeEmail(offer),
    buildReminderEmail(offer),
    buildBenefitEmail(offer),
    buildOfferEmail(offer)
  ];
}

function buildCampaignAutoresponder(campaign = {}) {
  return {
    campaignId: campaign.id || "",
    enabled: true,
    optInForm: true,
    thankYouMessage: campaign.thankYouMessage || "Thanks — check your inbox soon.",
    reminderEmail: true,
    specialOfferEmail: true,
    messages: buildFollowUpSequence(campaign)
  };
}

function routeLead(lead, campaign = {}) {
  const listName = routeLeadToList(lead);
  const sequenceName = getFollowUpBranch(lead);

  return {
    leadId: lead.id,
    campaignId: campaign.id || "",
    listName,
    sequenceName,
    followUpEnabled: true,
    status: "active"
  };
}

function addLeadToCampaignList(lead, campaign = {}) {
  return {
    leadId: lead.id,
    campaignId: campaign.id || "",
    listName: routeLeadToList(lead),
    sequenceName: getFollowUpBranch(lead),
    addedAt: new Date().toISOString()
  };
}

module.exports = {
  leadStatus,
  leadActions,
  createLead,
  tagLead,
  updateLeadScore,
  classifyLead,
  routeLeadToList,
  getFollowUpBranch,
  buildFollowUpSequence,
  buildCampaignAutoresponder,
  routeLead,
  addLeadToCampaignList
};
