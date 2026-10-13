// xspresso_844_lead_followup.js
import { uid, nowIso } from './xspresso_837_utils.js';

export function createLead(input = {}) {
  return {
    id: uid('lead'),
    name: input.name || '',
    email: input.email || '',
    sourceCampaignId: input.sourceCampaignId || null,
    tags: input.tags || [],
    score: input.score || 0,
    status: input.status || 'new',
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

export function scoreLead(lead, event) {
  const next = { ...lead, updatedAt: nowIso() };
  const points = { opened_email: 5, clicked_link: 10, replied: 15, visited_offer: 12, purchased: 50 };
  next.score = (next.score || 0) + (points[event] || 0);
  if (event === 'purchased') next.status = 'customer';
  else if (next.score >= 50) next.status = 'hot';
  else if (next.score >= 20) next.status = 'warm';
  return next;
}
