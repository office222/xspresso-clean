// Xspresso lead capture and follow-up helpers

export const LeadStatus = {
  NEW: "new",
  WARM: "warm",
  HOT: "hot",
  CUSTOMER: "customer",
};

export function createLead(input = {}) {
  return {
    id: input.id || `lead_${Date.now()}`,
    name: input.name || "",
    email: input.email || "",
    phone: input.phone || "",
    sourceCampaign: input.sourceCampaign || "",
    sourcePlatform: input.sourcePlatform || "",
    tags: input.tags || [],
    score: input.score || 0,
    status: input.status || LeadStatus.NEW,
    createdAt: new Date().toISOString(),
  };
}

export function scoreLead(lead, action) {
  const next = { ...lead };
  switch (action) {
    case "opened_email": next.score += 5; break;
    case "clicked_link": next.score += 10; break;
    case "replied": next.score += 15; break;
    case "visited_offer": next.score += 12; break;
    case "purchased": next.score += 50; next.status = LeadStatus.CUSTOMER; break;
    default: break;
  }
  return next;
}

export function classifyLead(lead) {
  if ((lead.score || 0) >= 50) return LeadStatus.HOT;
  if ((lead.score || 0) >= 20) return LeadStatus.WARM;
  if ((lead.score || 0) > 0) return LeadStatus.NEW;
  return LeadStatus.NEW;
}

export function buildFollowUpSequence() {
  return [
    { day: 0, subject: "Thanks for checking this out", body: "Here’s a quick introduction to the offer." },
    { day: 1, subject: "A quick reminder", body: "You may want to take another look." },
    { day: 3, subject: "Why this may be worth a second look", body: "Here’s a little more about the value." },
    { day: 5, subject: "Don’t miss this", body: "Here’s a special reason to act now." },
  ];
}
