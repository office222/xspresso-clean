const TOKEN_KEY = 'xspresso_token';
const el = (tag, text = '', cls = '') => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
const token = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
async function api(path, options = {}) { const headers = new Headers(options.headers || {}); if (token()) headers.set('authorization', `Bearer ${token()}`); if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json'); const r = await fetch(path, { ...options, headers }); const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.message || data.error || `Request failed (${r.status}).`); return data; }

function buildPanel() {
  const panel = el('section', '', 'panel'); panel.id = 'xspresso-campaign-history-panel';
  panel.append(el('h2', 'Draft history'), el('p', 'Review earlier versions or restore one as a new draft. Restored drafts require approval again.'));
  const row = el('div', '', 'row'); const campaign = el('input'); campaign.placeholder = 'Campaign ID'; campaign.setAttribute('aria-label', 'Campaign ID');
  const load = el('button', 'Load revisions', 'button'); load.type = 'button'; row.append(campaign, load); panel.append(row);
  const status = el('p', 'Sign in to view campaign history.'); status.setAttribute('aria-live', 'polite'); panel.append(status);
  const list = el('div', '', 'stack'); panel.append(list);
  const details = el('pre', '', 'code-block'); details.hidden = true; panel.append(details);
  let selected = null; let currentVersion = 0;
  const show = async () => {
    list.replaceChildren(); details.hidden = true; selected = null;
    const id = campaign.value.trim(); if (!id) { status.textContent = 'Enter a campaign ID.'; return; }
    try {
      const result = await api(`/api/campaigns/${encodeURIComponent(id)}/revisions`);
      const revisions = result.revisions || [];
      status.textContent = revisions.length ? `${revisions.length} revision(s)` : 'No revisions found.';
      for (const rev of revisions) {
        const card = el('div', '', 'card');
        const title = el('strong', `v${rev.version} · ${rev.kind}`);
        const time = el('small', `${rev.createdAt || ''}${rev.actorId ? ` · by ${rev.actorId}` : ''}`);
        const actions = el('div', '', 'row'); const view = el('button', 'View', 'button secondary'); view.type = 'button';
        const restore = el('button', 'Restore as new draft', 'button'); restore.type = 'button';
        view.addEventListener('click', async () => { try { const item = await api(`/api/campaigns/${encodeURIComponent(id)}/revisions/${encodeURIComponent(rev.id)}`); selected = rev; details.textContent = JSON.stringify(item.draft, null, 2); details.hidden = false; status.textContent = `Viewing revision v${rev.version}.`; } catch (e) { status.textContent = e.message; } });
        restore.addEventListener('click', async () => { if (!Number.isSafeInteger(currentVersion)) { status.textContent = 'Load current draft version first.'; return; } if (!window.confirm(`Restore revision v${rev.version} as a new draft? It will need approval again.`)) return; try { const out = await api(`/api/campaigns/${encodeURIComponent(id)}/revisions/${encodeURIComponent(rev.id)}/restore`, { method: 'POST', body: JSON.stringify({ expectedVersion: currentVersion }) }); currentVersion = out.version; status.textContent = `Restored as v${out.version}; review and approve it before export.`; await show(); } catch (e) { status.textContent = e.message; } });
        actions.append(view, restore); card.append(title, time, actions); list.append(card);
      }
    } catch (e) { status.textContent = e.message; }
  };
  load.addEventListener('click', async () => { try { const d = await api(`/api/campaigns/${encodeURIComponent(campaign.value.trim())}/draft`); currentVersion = d.version; await show(); } catch (e) { status.textContent = e.message; } });
  return panel;
}

function ensurePanel() { const app = document.getElementById('app'); if (!app || document.getElementById('xspresso-campaign-history-panel')) return; const panel = buildPanel(); const main = app.querySelector('main') || app; main.append(panel); }
if (typeof document !== 'undefined') { const start = () => { ensurePanel(); const root = document.getElementById('app'); if (root && typeof MutationObserver !== 'undefined') new MutationObserver(ensurePanel).observe(root, { childList: true, subtree: true }); }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start(); }
