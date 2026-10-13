// xspresso_757_lead_followup_screen.js
// Lead capture, scoring, and follow-up helpers

export function scoreLead(lead, eventType) {
  const scores = {
    opened_email: 5,
    clicked_link: 10,
    replied: 15,
    visited_offer: 12,
    purchased: 50
  };
  const delta = scores[eventType] || 0;
  const next = { ...lead, score: (lead.score || 0) + delta };
  if (eventType === 'purchased') next.status = 'customer';
  return next;
}

export function buildFollowUpSequence() {
  return [
    { day: 0, subject: 'Thanks for checking this out', body: 'Here’s a quick intro.' },
    { day: 1, subject: 'A quick reminder', body: 'You may want to take another look.' },
    { day: 3, subject: 'Why this may help', body: 'Here’s a bit more detail.' },
    { day: 5, subject: 'Don’t miss this', body: 'A final reason to act.' }
  ];
}

export function renderLeadFollowUp(lead, sequence = buildFollowUpSequence()) {
  return `
    <div class="lead-followup">
      <h2>${escapeHtml(lead.name || 'Lead')}</h2>
      <p><strong>Status:</strong> ${escapeHtml(lead.status || 'new')}</p>
      <p><strong>Score:</strong> ${lead.score || 0}</p>
      <ol>
        ${sequence.map(step => `<li><strong>Day ${step.day}:</strong> ${escapeHtml(step.subject)}</li>`).join('')}
      </ol>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
