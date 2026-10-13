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

export function updateLeadScore(lead = {}, action = '') {
  const updated = { ...lead, score: lead.score ?? 0 };
  switch (action) {
    case 'opened_email': updated.score += 5; break;
    case 'clicked_link': updated.score += 10; break;
    case 'replied': updated.score += 15; break;
    case 'visited_offer': updated.score += 12; break;
    case 'purchased': updated.score += 50; updated.status = 'customer'; break;
    default: break;
  }
  return updated;
}

export function classifyLead(lead = {}) {
  const score = lead.score ?? 0;
  if (score >= 50) return 'hot';
  if (score >= 20) return 'warm';
  if (score > 0) return 'cold';
  return 'new';
}

export function buildFollowUpSequence(offerName = 'your offer') {
  return [
    { day: 0, type: 'welcome', subject: `Thanks for checking out ${offerName}`, body: 'Here is a quick introduction.' },
    { day: 1, type: 'reminder', subject: 'A quick reminder', body: 'You may want to take another look.' },
    { day: 3, type: 'benefit', subject: 'Why this may be worth a second look', body: 'Here is a little more about the value.' },
    { day: 5, type: 'offer', subject: 'Don\'t miss this', body: 'Here is a reason to act now.' }
  ];
}