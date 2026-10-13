// xspresso_781_lead_followup.js
// Lead capture, scoring, and follow-up helpers

export function createLead({ name = "", email = "", sourceCampaignId = "", sourcePlatform = "" } = {}) {
  return {
    id: `lead_${Date.now()}`,
    name,
    email,
    sourceCampaignId,
    sourcePlatform,
    tags: [],
    score: 0,
    status: "new",
    createdAt: new Date().toISOString()
  };
}

export function tagLead(lead, tag) {
  const tags = new Set(lead.tags || []);
  tags.add(tag);
  return { ...lead, tags: Array.from(tags) };
}

export function scoreLead(lead, event) {
  const deltaMap = {
    opened_email: 5,
    clicked_link: 10,
    visited_offer: 12,
    replied: 15,
    purchased: 50
  };
  const delta = deltaMap[event] || 0;
  const score = (lead.score || 0) + delta;
  const status = score >= 50 ? "customer" : score >= 20 ? "hot" : score >= 10 ? "warm" : "new";
  return { ...lead, score, status };
}

export function buildFollowUpSequence(offerName = "the offer") {
  return [
    { day: 0, subject: `Thanks for checking out ${offerName}`, body: `Here’s a quick reminder about ${offerName}.` },
    { day: 1, subject: "A quick follow-up", body: "Just checking in to see if you had a chance to take a look." },
    { day: 3, subject: "One more helpful note", body: "Here’s a little more detail that may help you decide." },
    { day: 5, subject: "Last reminder", body: "If this is a fit, now may be the time to act." }
  ];
}

export function routeLeadToSequence(lead) {
  if (lead.status === "customer") return "post_purchase";
  if (lead.status === "hot") return "sales";
  if (lead.status === "warm") return "nurture";
  return "standard";
}
