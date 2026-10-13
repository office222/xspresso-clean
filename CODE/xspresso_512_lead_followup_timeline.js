// Xspresso - Lead Follow-up Timeline
// Purpose: manage lead capture and follow-up steps.

export function createLead(input = {}) {
  return {
    id: input.id || `lead_${Date.now()}`,
    name: input.name || '',
    email: input.email || '',
    phone: input.phone || '',
    sourceCampaign: input.sourceCampaign || '',
    sourcePlatform: input.sourcePlatform || '',
    tags: Array.isArray(input.tags) ? input.tags : [],
    score: Number(input.score || 0),
    status: input.status || 'new'
  };
}

export function buildFollowUpTimeline() {
  return [
    { day: 0, type: 'welcome', subject: 'Thanks for checking this out' },
    { day: 1, type: 'reminder', subject: 'A quick reminder' },
    { day: 3, type: 'benefit', subject: 'Why this may be worth another look' },
    { day: 5, type: 'offer', subject: 'Don’t miss this' }
  ];
}

export function scoreLead(lead, event) {
  const next = { ...lead };
  switch (event) {
    case 'opened_email': next.score += 5; break;
    case 'clicked_link': next.score += 10; break;
    case 'visited_offer': next.score += 12; break;
    case 'replied': next.score += 15; break;
    case 'purchased': next.score += 50; next.status = 'customer'; break;
    default: break;
  }
  return next;
}

export function classifyLead(lead) {
  if (lead.score >= 50) return 'hot';
  if (lead.score >= 20) return 'warm';
  if (lead.score > 0) return 'cold';
  return 'new';
}
