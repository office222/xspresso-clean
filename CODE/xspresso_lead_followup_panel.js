// xspresso_lead_followup_panel.js
// Lead Follow-up/Timeline Panel for Xspresso

/*
Handles display of:
- captured leads
- follow-up status (welcomed, reminded, replied, purchased)
- engagement score/timeline
- actions to move through next steps, trigger follow-ups, or add notes
*/

export function renderLeadFollowupPanel({ leads }) {
  if (!leads || !leads.length) {
    return `<div class="lead-followup-panel">
      <h3>Lead Timeline</h3>
      <p>No leads captured yet. When your campaign runs, leads will appear here!</p>
    </div>`;
  }
  return `<div class="lead-followup-panel">
    <h3>Lead Timeline</h3>
    <table class="lead-table">
      <tr><th>Name</th><th>Status</th><th>Score</th><th>Last Action</th></tr>
      ${leads.map(lead => `
        <tr><td>${lead.name || 'N/A'}</td>
          <td>${lead.status || 'new'}</td>
          <td>${lead.score}</td>
          <td>${lead.lastAction || ''}</td>
        </tr>`).join('')}
    </table>
    <div style="margin-top:10px;">Select a lead to see the full follow-up sequence and send next-step emails or reminders.</div>
  </div>`;
}
