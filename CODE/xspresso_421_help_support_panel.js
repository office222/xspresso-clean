/* xspresso_421_help_support_panel.js
   Help + support panel.
*/

export function buildHelpSupportPanel(topics = []) {
  const list = topics.length
    ? topics
    : [
        'Getting started',
        'Creating campaigns',
        'Monitoring ads',
        'Credits and billing',
        'Platform switching',
        'Troubleshooting alerts'
      ];

  return `
    <aside style="background:#fff;border:1px solid #e6e6e6;border-radius:14px;padding:16px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:10px;">Help</div>
      <div style="font-size:18px;font-weight:800;color:#111;margin-bottom:8px;">Need help?</div>
      <p style="margin:0 0 14px 0;color:#555;line-height:1.6;">We’ve got you. Find the answer fast or jump to the next step.</p>
      <div style="display:grid;gap:8px;">
        ${list.map((topic) => `
          <button type="button" style="text-align:left;padding:10px 12px;border-radius:10px;border:1px solid #ddd;background:#fafafa;cursor:pointer;">${topic}</button>
        `).join('')}
      </div>
    </aside>
  `;
}

export function buildInlineHelp(message = 'Xspresso helps you move faster without the guesswork.') {
  return `
    <div style="padding:12px 14px;border-left:4px solid #c65a1e;background:#fff7f1;border-radius:10px;color:#4a3322;line-height:1.5;">
      ${message}
    </div>
  `;
}
