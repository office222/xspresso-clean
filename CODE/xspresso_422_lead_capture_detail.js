/* xspresso_422_lead_capture_detail.js
   Lead capture + follow-up detail screen.
*/

export function buildLeadDetail(lead = {}) {
  const tags = Array.isArray(lead.tags) ? lead.tags : [];

  return `
    <section style="background:#fff;border:1px solid #e6e6e6;border-radius:14px;padding:16px;display:grid;gap:12px;">
      <div>
        <div style="font-size:20px;font-weight:800;color:#111;">${lead.name || 'New Lead'}</div>
        <div style="font-size:13px;color:#666;">${lead.email || 'No email yet'}</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
        <div><strong>Status</strong><br>${lead.status || 'new'}</div>
        <div><strong>Score</strong><br>${lead.score ?? 0}</div>
        <div><strong>Source</strong><br>${lead.sourceCampaign || 'Unknown'}</div>
      </div>

      <div>
        <strong>Tags</strong>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
          ${tags.map(tag => `<span style="padding:5px 10px;border-radius:999px;background:#f4f4f4;font-size:12px;">${tag}</span>`).join('')}
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button style="padding:9px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;">Send Follow-Up</button>
        <button style="padding:9px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;">Add Tag</button>
        <button style="padding:9px 12px;border-radius:8px;border:0;background:#c65a1e;color:#fff;cursor:pointer;">Move to Sales Sequence</button>
      </div>
    </section>
  `;
}

export function buildFollowUpTimeline(messages = []) {
  return `
    <section style="background:#fff;border:1px solid #e6e6e6;border-radius:14px;padding:16px;">
      <div style="font-size:18px;font-weight:800;color:#111;margin-bottom:12px;">Follow-up Timeline</div>
      <div style="display:grid;gap:10px;">
        ${messages.map((msg, idx) => `
          <div style="padding:12px;border:1px solid #eee;border-radius:10px;">
            <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Step ${idx + 1}</div>
            <div style="font-weight:700;color:#111;margin-top:4px;">${msg.subject || 'Untitled message'}</div>
            <div style="color:#555;line-height:1.5;margin-top:6px;">${msg.body || ''}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}
