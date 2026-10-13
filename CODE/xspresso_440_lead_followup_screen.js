// xspresso_440_lead_followup_screen.js
// Xspresso lead capture and follow-up screen logic.

export function createLead({ name = '', email = '', phone = '', sourceCampaign = '', sourcePlatform = '' } = {}) {
  return {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    phone,
    sourceCampaign,
    sourcePlatform,
    tags: ['new'],
    score: 0,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
}

export function updateLeadScore(lead = {}, action = '') {
  const next = { ...lead, score: Number(lead.score || 0) };

  switch (action) {
    case 'opened_email':
      next.score += 5;
      break;
    case 'clicked_link':
      next.score += 10;
      break;
    case 'replied':
      next.score += 15;
      break;
    case 'visited_offer':
      next.score += 12;
      break;
    case 'purchased':
      next.score += 50;
      next.status = 'customer';
      break;
    default:
      break;
  }

  return next;
}

export function classifyLead(lead = {}) {
  const score = Number(lead.score || 0);
  if (score >= 50) return 'hot';
  if (score >= 20) return 'warm';
  if (score > 0) return 'cold';
  return 'new';
}

export function buildFollowUpSequence() {
  return [
    { day: 0, type: 'welcome', subject: 'Thanks for checking this out', body: 'Here is a quick introduction to the offer.' },
    { day: 1, type: 'reminder', subject: 'A quick reminder', body: 'You may want to take another look.' },
    { day: 3, type: 'benefit', subject: 'Why this may be worth a second look', body: 'Here is a little more about the value.' },
    { day: 5, type: 'offer', subject: 'Don’t miss this', body: 'Here is a special reason to act now.' },
  ];
}

export function routeLeadToSequence(lead = {}) {
  const group = classifyLead(lead);
  if (group === 'hot') return 'sales-sequence';
  if (group === 'warm') return 'nurture-sequence';
  return 'standard-follow-up';
}