// xspresso_795_lead_followup_screen.js
// Lead capture and follow-up helpers for Xspresso

export function createLead({ name = '', email = '', sourceCampaign = '', sourcePlatform = '' } = {}) {
  return {
    id: `lead_${Date.now()}`,
    name,
    email,
    sourceCampaign,
    sourcePlatform,
    tags: [],
    score: 0,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
}

export function scoreLead(lead, action) {
  const next = { ...lead };
  switch (action) {
    case 'opened_email': next.score += 5; break;
    case 'clicked_link': next.score += 10; break;
    case 'replied': next.score += 15; break;
    case 'visited_offer': next.score += 12; break;
    case 'purchased': next.score += 50; next.status = 'customer'; break;
    default: break;
  }
  return next;
}

export function classifyLead(lead) {
  if ((lead?.score || 0) >= 50) return 'hot';
  if ((lead?.score || 0) >= 20) return 'warm';
  if ((lead?.score || 0) > 0) return 'cold';
  return 'new';
}

export function buildFollowUpSequence({ offerName = 'the offer' } = {}) {
  return [
    { day: 0, subject: `Thanks for checking out ${offerName}`, body: 'Here is a quick intro to the offer.' },
    { day: 1, subject: 'A quick reminder', body: 'You may want to take another look.' },
    { day: 3, subject: 'Why this could help', body: 'Here is a little more value and context.' },
    { day: 5, subject: 'Last chance to review', body: 'A final reminder before you move on.' },
  ];
}

export function leadCopy(lead) {
  const group = classifyLead(lead);
  return {
    headline: `Lead status: ${group}`,
    body: group === 'hot'
      ? 'Move this lead into a sales sequence.'
      : 'Keep the conversation going automatically.',
  };
}
