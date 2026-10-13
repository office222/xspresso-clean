// Xspresso Lead Follow-up v7
// Capture leads, score them, and route them into the right follow-up path.

export function createLead(payload = {}) {
  return {
    id: `lead_${Date.now()}`,
    name: payload.name || '',
    email: payload.email || '',
    phone: payload.phone || '',
    sourceCampaign: payload.sourceCampaign || '',
    sourcePlatform: payload.sourcePlatform || '',
    tags: payload.tags || [],
    status: 'new',
    score: 0,
    createdAt: new Date().toISOString()
  };
}

export function updateLeadScore(lead = {}, action = '') {
  const scoreMap = {
    opened_email: 5,
    clicked_link: 10,
    replied: 15,
    visited_offer: 12,
    purchased: 50
  };

  const delta = scoreMap[action] || 0;
  const score = (lead.score || 0) + delta;
  const status = action === 'purchased' ? 'customer' : lead.status || 'new';

  return { ...lead, score, status };
}

export function classifyLead(lead = {}) {
  if ((lead.score || 0) >= 50) return 'hot';
  if ((lead.score || 0) >= 20) return 'warm';
  if ((lead.score || 0) > 0) return 'cold';
  return 'new';
}

export function routeLead(lead = {}) {
  const group = classifyLead(lead);
  if (group === 'hot') return 'sales-sequence';
  if (group === 'warm') return 'nurture-sequence';
  return 'standard-follow-up';
}

export function buildFollowUpSequence() {
  return [
    { day: 0, type: 'welcome', subject: 'Thanks for checking this out' },
    { day: 1, type: 'reminder', subject: 'A quick reminder' },
    { day: 3, type: 'benefit', subject: 'Why this may be worth a second look' },
    { day: 5, type: 'offer', subject: 'Don\'t miss this' }
  ];
}
