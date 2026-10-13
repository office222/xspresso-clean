// xspresso_446_lead_followup_screen.js
// Lead capture + follow-up screen helpers for Xspresso

export function buildLeadFollowUpScreen(lead = {}, campaign = {}) {
  return {
    leadId: lead.id || null,
    leadName: lead.name || "Unknown",
    sourceCampaign: campaign.name || "Untitled Campaign",
    status: lead.status || "new",
    score: lead.score || 0,
    tags: lead.tags || [],
    timeline: buildFollowUpTimeline(lead, campaign),
    actions: [
      "view",
      "tag",
      "rescore",
      "move_to_hot",
      "start_sequence",
      "mark_customer"
    ]
  };
}

export function buildFollowUpTimeline(lead = {}, campaign = {}) {
  const name = lead.name || "there";
  const offer = campaign.offerName || campaign.name || "this offer";

  return [
    { day: 0, type: "welcome", subject: `Thanks for checking out ${offer}`, body: `Hi ${name}, thanks for your interest.` },
    { day: 1, type: "reminder", subject: `A quick reminder about ${offer}`, body: `Just a quick note in case you want another look.` },
    { day: 3, type: "benefit", subject: `Why ${offer} may be worth another look`, body: `Here’s a bit more about the value.` },
    { day: 5, type: "offer", subject: `Don’t miss your chance`, body: `If you’re ready, here’s the next step.` }
  ];
}

export function scoreLead(lead = {}, action = "") {
  const score = Number(lead.score || 0);
  const boosts = {
    opened_email: 5,
    clicked_link: 10,
    visited_offer: 12,
    replied: 15,
    purchased: 50
  };

  const nextScore = score + (boosts[action] || 0);
  const status = nextScore >= 50 ? "customer" : nextScore >= 20 ? "hot" : nextScore > 0 ? "warm" : "new";

  return {
    ...lead,
    score: nextScore,
    status
  };
}

export function getLeadActions() {
  return [
    "Open profile",
    "Add tag",
    "Rescore",
    "Start follow-up",
    "Move to hot list",
    "Mark as customer"
  ];
}
