// xspresso_822_lead_followup_screen_v8.js
// Lead capture and follow-up helpers for Xspresso

export function createLead(data = {}) {
  return {
    id: data.id || `lead_${Date.now()}`,
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    sourceCampaign: data.sourceCampaign || "",
    sourcePlatform: data.sourcePlatform || "",
    tags: data.tags || [],
    score: data.score || 0,
    status: data.status || "new",
  };
}

export function scoreLead(lead, event) {
  const scoreMap = {
    opened_email: 5,
    clicked_link: 10,
    visited_offer: 12,
    replied: 15,
    purchased: 50,
  };

  const delta = scoreMap[event] || 0;
  const next = { ...lead, score: (lead.score || 0) + delta };

  if (event === "purchased") next.status = "customer";
  if (next.score >= 50 && next.status !== "customer") next.status = "hot";
  else if (next.score >= 20) next.status = "warm";

  return next;
}

export function buildFollowUpSequence() {
  return [
    { day: 0, subject: "Thanks for checking this out", body: "Here’s a quick introduction to the offer." },
    { day: 1, subject: "A quick reminder", body: "You may want to take another look." },
    { day: 3, subject: "Why this may be worth a second look", body: "Here’s a little more about the value." },
    { day: 5, subject: "Don’t miss this", body: "Here’s a special reason to act now." },
  ];
}
