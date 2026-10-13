export function createLead({ name = '', email = '', phone = '', sourceCampaignId = null, sourcePlatform = null } = {}) {
  return {
    id: `lead_${Date.now()}`,
    name,
    email,
    phone,
    sourceCampaignId,
    sourcePlatform,
    status: 'new',
    score: 0,
    tags: [],
    createdAt: new Date().toISOString(),
  };
}

export function updateLeadScore(lead, eventType) {
  const next = structuredClone(lead || {});
  const scoreMap = {
    opened_email: 5,
    clicked_link: 10,
    replied: 15,
    visited_offer: 12,
    purchased: 50,
  };
  next.score = Number(next.score || 0) + (scoreMap[eventType] || 0);
  if (eventType === 'purchased') next.status = 'customer';
  return next;
}

export function classifyLead(lead) {
  const score = Number(lead?.score || 0);
  if (score >= 50) return 'hot';
  if (score >= 20) return 'warm';
  if (score > 0) return 'cold';
  return 'new';
}

export function routeLeadToSequence(lead) {
  const classification = classifyLead(lead);
  if (classification === 'hot') return 'sales-sequence';
  if (classification === 'warm') return 'nurture-sequence';
  return 'standard-follow-up';
}

export function buildFollowUpSequence({ offerName = 'the offer' } = {}) {
  return [
    { day: 0, type: 'welcome', subject: `Thanks for checking out ${offerName}`, body: 'Here is a quick introduction to the offer.' },
    { day: 1, type: 'reminder', subject: 'A quick reminder', body: 'You may want to take another look.' },
    { day: 3, type: 'benefit', subject: 'Why this may be worth a second look', body: 'Here is a little more about the value.' },
    { day: 5, type: 'offer', subject: 'Don\'t miss this', body: 'Here is a reason to act now.' },
  ];
}

export function buildLeadTimeline(lead) {
  const sequenceName = routeLeadToSequence(lead);
  return {
    leadId: lead.id,
    leadName: lead.name || 'Unnamed Lead',
    classification: classifyLead(lead),
    sequenceName,
    nextStep: lead.status === 'customer' ? 'move_to_customer_flow' : 'continue_follow_up',
  };
}
