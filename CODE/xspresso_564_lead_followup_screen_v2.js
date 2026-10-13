// Xspresso - Lead Follow-Up Screen (v2)
// Purpose: Capture leads, score engagement, and route follow-up automatically.

export function createLead(contact = {}) {
  return {
    id: contact.id || `lead_${Date.now()}`,
    name: contact.name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    sourceCampaign: contact.sourceCampaign || '',
    sourcePlatform: contact.sourcePlatform || '',
    tags: contact.tags || [],
    status: contact.status || 'new',
    score: contact.score || 0,
    createdAt: new Date().toISOString(),
  };
}

export function updateLeadScore(lead, eventType) {
  const increments = {
    opened_email: 5,
    clicked_link: 10,
    visited_offer: 12,
    replied: 15,
    purchased: 50,
  };
  const score = (lead.score || 0) + (increments[eventType] || 0);
  const status = score >= 50 ? 'customer' : score >= 20 ? 'hot' : score > 0 ? 'warm' : 'new';
  return { ...lead, score, status };
}

export function tagLead(lead, tag) {
  const tags = new Set(lead.tags || []);
  tags.add(tag);
  return { ...lead, tags: Array.from(tags) };
}

export function buildFollowUpSequence() {
  return [
    { day: 0, type: 'welcome', subject: 'Thanks for checking this out', body: 'Here is a quick introduction.' },
    { day: 1, type: 'reminder', subject: 'A quick reminder', body: 'You may want to take another look.' },
    { day: 3, type: 'benefit', subject: 'Why this may be worth a second look', body: 'Here is a little more context.' },
    { day: 5, type: 'offer', subject: 'Don\'t miss this', body: 'Here is a special reason to act now.' },
  ];
}

export function routeLead(lead) {
  const list = lead.score >= 50 ? 'hot-leads' : lead.score >= 20 ? 'warm-leads' : 'new-leads';
  const branch = lead.score >= 50 ? 'sales-sequence' : lead.score >= 20 ? 'nurture-sequence' : 'standard-follow-up';
  return { ...lead, list, branch };
}

export function followUpSummary(lead) {
  return {
    leadId: lead.id,
    status: lead.status,
    score: lead.score,
    tags: lead.tags,
    nextSequence: lead.branch || 'standard-follow-up',
  };
}
