export function createLead({ id, name = '', email = '', sourceCampaignId = '', sourcePlatform = '' }) {
  return {
    id: id || `lead_${Date.now()}`,
    name,
    email,
    sourceCampaignId,
    sourcePlatform,
    score: 0,
    tags: ['new'],
    status: 'new',
    createdAt: new Date().toISOString(),
  };
}

export function updateLeadScore(lead, eventType) {
  const scoreMap = {
    opened_email: 5,
    clicked_link: 10,
    visited_offer: 12,
    replied: 15,
    purchased: 50,
  };

  const delta = scoreMap[eventType] || 0;
  const score = (lead.score || 0) + delta;
  const status = score >= 50 ? 'customer' : score >= 20 ? 'hot' : score >= 5 ? 'warm' : 'new';

  return {
    ...lead,
    score,
    status,
    tags: Array.from(new Set([...(lead.tags || []), eventType].filter(Boolean))),
    updatedAt: new Date().toISOString(),
  };
}

export function buildFollowUpTimeline(lead) {
  const bucket = lead.status || 'new';

  if (bucket === 'customer') {
    return [
      { day: 0, type: 'thank_you', subject: 'Thanks for your order', body: 'We appreciate you.' },
      { day: 3, type: 'usage', subject: 'Quick tips to get more value', body: 'Here are a few ways to get the most from your purchase.' },
    ];
  }

  if (bucket === 'hot') {
    return [
      { day: 0, type: 'followup', subject: 'A quick reminder', body: 'You may want to take another look.' },
      { day: 1, type: 'proof', subject: 'Why this could help', body: 'Here is a bit more detail and proof.' },
      { day: 3, type: 'close', subject: 'Still interested?', body: 'If this is a fit, now is a good time to act.' },
    ];
  }

  return [
    { day: 0, type: 'welcome', subject: 'Thanks for checking this out', body: 'Here is a quick introduction.' },
    { day: 2, type: 'benefit', subject: 'A little more detail', body: 'Here is why this may be useful.' },
    { day: 5, type: 'offer', subject: 'One more look', body: 'You may want to revisit this offer.' },
  ];
}

export function routeLeadToList(lead) {
  if (lead.status === 'customer') return 'customers';
  if (lead.status === 'hot') return 'hot-leads';
  if (lead.status === 'warm') return 'warm-leads';
  return 'new-leads';
}
