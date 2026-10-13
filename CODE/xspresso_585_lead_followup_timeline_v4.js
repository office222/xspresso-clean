// xspresso_585_lead_followup_timeline_v4.js
// Lead capture, scoring, and follow-up timeline for Xspresso.

export function createLead({ name = '', email = '', sourceCampaign = '', sourcePlatform = '' }) {
  return {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    sourceCampaign,
    sourcePlatform,
    tags: ['new'],
    score: 0,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
}

export function scoreLead(lead, action) {
  const scoreMap = {
    opened_email: 5,
    clicked_link: 10,
    visited_offer: 12,
    replied: 15,
    purchased: 50,
  };

  const nextScore = (lead.score || 0) + (scoreMap[action] || 0);
  const status = nextScore >= 50 ? 'customer' : nextScore >= 20 ? 'hot' : nextScore >= 1 ? 'warm' : 'new';

  return {
    ...lead,
    score: nextScore,
    status,
    tags: Array.from(new Set([...(lead.tags || []), action].filter(Boolean))),
    updatedAt: new Date().toISOString(),
  };
}

export function buildFollowUpTimeline({ offerName = 'Your Offer' } = {}) {
  return [
    { day: 0, type: 'welcome', subject: `Thanks for checking out ${offerName}`, body: 'Here is a quick introduction.' },
    { day: 1, type: 'reminder', subject: 'A quick reminder', body: 'You may want to take another look.' },
    { day: 3, type: 'benefit', subject: 'Why this is worth a look', body: 'Here is the value in one place.' },
    { day: 5, type: 'offer', subject: 'Don\'t miss this', body: 'Here is a reason to act now.' },
  ];
}

export function routeLead(lead) {
  if (lead.status === 'customer') return 'customer-sequence';
  if (lead.status === 'hot') return 'sales-sequence';
  if (lead.status === 'warm') return 'nurture-sequence';
  return 'standard-follow-up';
}
