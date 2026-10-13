// xspresso_835_lead_followup.js
export function createLead(input = {}) {
  return {
    id: input.id || `lead_${Date.now()}`,
    name: input.name?.trim() || "",
    email: input.email?.trim() || "",
    sourceCampaign: input.sourceCampaign || "",
    sourcePlatform: input.sourcePlatform || "",
    tags: Array.isArray(input.tags) ? input.tags : [],
    score: Number(input.score || 0),
    status: input.status || "new"
  };
}

export function scoreLead(lead, action) {
  const points = {
    opened_email: 5,
    clicked_link: 10,
    visited_offer: 12,
    replied: 15,
    purchased: 50
  };

  const nextScore = lead.score + (points[action] || 0);
  const nextStatus = nextScore >= 50 ? "customer" : nextScore >= 20 ? "hot" : nextScore > 0 ? "warm" : "new";

  return {
    ...lead,
    score: nextScore,
    status: nextStatus
  };
}

export function buildFollowUpSequence(offerName) {
  return [
    {
      day: 0,
      subject: `Thanks for checking out ${offerName}`,
      body: "Here’s a quick reminder and the next step."
    },
    {
      day: 1,
      subject: "A quick follow-up",
      body: "Just checking in with a short reminder."
    },
    {
      day: 3,
      subject: "Why this may help",
      body: "Here’s another angle on the value of the offer."
    },
    {
      day: 5,
      subject: "Last reminder",
      body: "A final note before you decide."
    }
  ];
}

export function routeLead(lead) {
  if (lead.status === "customer") return "customer-list";
  if (lead.status === "hot") return "sales-sequence";
  if (lead.status === "warm") return "nurture-sequence";
  return "new-leads-list";
}
