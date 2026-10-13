// xspresso_673_lead_followup.js
// Lead capture, scoring, and follow-up helpers.

export function createLead({ name = '', email = '', phone = '', sourceCampaign = '', sourcePlatform = '' } = {}) {
  return {
    id: `lead_${Date.now()}`,
    name,
    email,
    phone,
    sourceCampaign,
    sourcePlatform,
    tags: [],
    status: 'new',
    score: 0,
    createdAt: new Date().toISOString()
  };
}

export function updateLeadScore(lead, action) {
  const updated = { ...lead };
  switch (action) {
    case 'opened_email': updated.score += 5; break;
    case 'clicked_link': updated.score += 10; break;
    case 'visited_offer': updated.score += 12; break;
    case 'replied': updated.score += 15; break;
    case 'purchased': updated.score += 50; updated.status = 'customer'; break;
    default: break;
  }
  return updated;
}

export function classifyLead(lead) {
  if (lead.status === 'customer') return 'customer';
  if (lead.score >= 50) return 'hot';
  if (lead.score >= 20) return 'warm';
  if (lead.score > 0) return 'cold';
  return 'new';
}

export function buildFollowUpSequence() {
  return [
    { day: 0, subject: 'Thanks for checking this out', body: 'Here is your quick intro.' },
    { day: 1, subject: 'A quick reminder', body: 'You may want to take another look.' },
    { day: 3, subject: 'Why this may help', body: 'Here is a little more value.' },
    { day: 5, subject: 'Last reminder', body: 'A final reason to act now.' }
  ];
}
