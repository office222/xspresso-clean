// xspresso_410_lead_followup_screen.js
// Lead capture and follow-up screen for Xspresso.

export const defaultFollowUpSequence = [
  {
    day: 0,
    subject: 'Thanks for checking this out',
    body: 'Here is a quick introduction to the offer.'
  },
  {
    day: 1,
    subject: 'A quick reminder',
    body: 'You may want to take another look.'
  },
  {
    day: 3,
    subject: 'Why this may be worth a second look',
    body: 'Here is a little more about the value.'
  },
  {
    day: 5,
    subject: 'Do not miss this',
    body: 'Here is a special reason to act now.'
  },
];

export function createLead(input) {
  return {
    id: input.id || `lead_${Date.now()}`,
    name: input.name || '',
    email: input.email || '',
    phone: input.phone || '',
    sourceCampaign: input.sourceCampaign || '',
    sourcePlatform: input.sourcePlatform || '',
    tags: input.tags || [],
    status: input.status || 'new',
    score: input.score || 0,
  };
}

export function updateLeadScore(lead, action) {
  const updated = { ...lead };

  switch (action) {
    case 'opened_email':
      updated.score += 5;
      break;
    case 'clicked_link':
      updated.score += 10;
      break;
    case 'replied':
      updated.score += 15;
      break;
    case 'visited_offer':
      updated.score += 12;
      break;
    case 'purchased':
      updated.score += 50;
      updated.status = 'customer';
      break;
    default:
      break;
  }

  return updated;
}

export function classifyLead(lead) {
  if (lead.score >= 50) return 'hot';
  if (lead.score >= 20) return 'warm';
  if (lead.score > 0) return 'cold';
  return 'new';
}

export function buildFollowUpScreen(campaignName, leads = []) {
  return `
    <section class="panel followup-panel">
      <h2>Lead Capture & Follow-Up</h2>
      <p>Keep the conversation going automatically.</p>
      <div class="followup-campaign"><strong>Campaign:</strong> ${campaignName}</div>
      <div class="followup-sequence">
        ${defaultFollowUpSequence.map(step => `<div class="followup-step"><strong>Day ${step.day}</strong>: ${step.subject}</div>`).join('')}
      </div>
      <div class="followup-leads">
        ${leads.map(lead => `<div class="lead-row">${lead.name || lead.email} — ${classifyLead(lead)}</div>`).join('') || '<p>No leads yet.</p>'}
      </div>
      <p class="followup-note">Xspresso helps you follow up without starting from scratch every time.</p>
    </section>
  `;
}
