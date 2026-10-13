/* xspresso_419_ui_shell_components.js
   Reusable UI shell helpers for Xspresso.
   Browser-friendly, no framework required.
*/

export function createTopBar({ title = 'Xspresso', subtitle = 'Done-for-you marketing' } = {}) {
  return `
    <header class="xspresso-topbar" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;background:#ffffff;border-bottom:1px solid #e5e5e5;">
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <img src="images/Xspresso_cup.gif" alt="Xspresso" style="display:block;width:52px;height:auto;flex:0 0 auto;" />
        <div style="min-width:0;">
          <div style="font-size:20px;font-weight:700;line-height:1.1;color:#111111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
          <div style="font-size:12px;color:#c65a1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${subtitle}</div>
        </div>
      </div>
      <div class="xspresso-topbar-actions" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
        <button data-action="try-demo" style="background:#c65a1e;color:#fff;border:0;border-radius:6px;padding:10px 14px;font-weight:700;cursor:pointer;">Try the Demo</button>
        <button data-action="see-pricing" style="background:#ffffff;color:#111;border:1px solid #d0d0d0;border-radius:6px;padding:10px 14px;font-weight:700;cursor:pointer;">See Pricing</button>
      </div>
    </header>
  `;
}

export function createSidebar(items = []) {
  const nav = items.map((item) => `
    <a href="${item.href || '#'}" style="display:block;padding:10px 12px;border-radius:8px;color:${item.active ? '#111' : '#444'};background:${item.active ? '#f7f1e8' : 'transparent'};text-decoration:none;font-weight:${item.active ? '700' : '500'};">${item.label}</a>
  `).join('');

  return `
    <aside style="width:240px;max-width:100%;padding:16px;background:#fff;border-right:1px solid #eee;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:10px;">Navigation</div>
      <nav style="display:grid;gap:6px;">${nav}</nav>
    </aside>
  `;
}

export function createCard({ title, value, note, accent = '#c65a1e' } = {}) {
  return `
    <section style="background:#fff;border:1px solid #e6e6e6;border-radius:14px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">${title || 'Card'}</div>
      <div style="font-size:30px;line-height:1.1;font-weight:800;color:${accent};">${value ?? ''}</div>
      <div style="margin-top:8px;font-size:14px;line-height:1.5;color:#555;">${note || ''}</div>
    </section>
  `;
}

export function createStatusPill(status = 'info') {
  const map = {
    good: { bg: '#e8f6ea', fg: '#176b2d' },
    warning: { bg: '#fff4e5', fg: '#8a4b00' },
    danger: { bg: '#fdecec', fg: '#a51c1c' },
    info: { bg: '#eef4ff', fg: '#2457a6' }
  };
  const c = map[status] || map.info;
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${c.bg};color:${c.fg};font-size:12px;font-weight:700;">${status}</span>`;
}
