const TOKEN_KEY = 'xspresso.session.v1';
const API_BASE = '/api';
const app = document.getElementById('app');
const state = { token: sessionStorage.getItem(TOKEN_KEY) || '', user: null, view: 'overview', campaigns: [], leads: [], alerts: [], credits: 0, settings: null, selectedCampaign: null, draft: null, draftVersion: 0, notice: null, busy: false, signup: false };

class ApiError extends Error { constructor(status, payload) { super(payload?.message || 'Request failed.'); this.status = status; this.code = payload?.error || 'REQUEST_FAILED'; this.payload = payload; } }
async function request(path, { method = 'GET', body, idempotencyKey } = {}) {
  const headers = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (state.token) headers.authorization = `Bearer ${state.token}`;
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
  let response;
  try { response = await fetch(`${API_BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin' }); }
  catch { throw new ApiError(0, { message: 'Could not reach Xspresso. Check your connection and try again.' }); }
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) signOutLocal();
    throw new ApiError(response.status, payload);
  }
  return payload;
}
function signOutLocal() { state.token = ''; state.user = null; sessionStorage.removeItem(TOKEN_KEY); }
const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  signup: (name, email, password) => request('/auth/signup', { method: 'POST', body: { name, email, password } }),
  me: () => request('/auth/me'), logout: () => request('/auth/logout', { method: 'POST' }),
  campaigns: () => request('/campaigns'), createCampaign: body => request('/campaigns', { method: 'POST', body }),
  generate: (id, notes) => request(`/campaigns/${encodeURIComponent(id)}/generate`, { method: 'POST', body: { notes }, idempotencyKey: crypto.randomUUID() }),
  getDraft: id => request(`/campaigns/${encodeURIComponent(id)}/draft`),
  saveDraft: (id, expectedVersion, draft) => request(`/campaigns/${encodeURIComponent(id)}/draft`, { method: 'PUT', body: { expectedVersion, draft } }),
  approveDraft: (id, expectedVersion) => request(`/campaigns/${encodeURIComponent(id)}/approve`, { method: 'POST', body: { expectedVersion } }),
  monitor: id => request(`/campaigns/${encodeURIComponent(id)}/monitor`, { method: 'POST', body: {} }),
  leads: () => request('/leads'), addLead: body => request('/leads', { method: 'POST', body }),
  alerts: () => request('/alerts'), resolveAlert: id => request(`/alerts/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: {} }),
  credits: () => request('/credits'), settings: () => request('/settings'), saveSettings: body => request('/settings', { method: 'PATCH', body })
};

function node(tag, className, text) { const item = document.createElement(tag); if (className) item.className = className; if (text !== undefined && text !== null) item.textContent = String(text); return item; }
function button(label, action, variant = 'btn-secondary', small = false) { const b = node('button', `btn ${variant}${small ? ' btn-small' : ''}`, label); b.type = 'button'; b.dataset.action = action; return b; }
function field(labelText, name, type = 'text', placeholder = '', options = {}) {
  const wrap = node('div', `field${options.full ? ' full' : ''}`); const label = node('label', '', labelText); label.htmlFor = name;
  let input;
  if (type === 'textarea') { input = node('textarea'); input.placeholder = placeholder; if (options.rows) input.rows = options.rows; }
  else if (type === 'select') { input = node('select'); for (const option of options.options || []) { const opt = node('option', '', option.label); opt.value = option.value; input.append(opt); } }
  else { input = node('input'); input.type = type; input.placeholder = placeholder; }
  input.id = name; input.name = name; if (options.required) input.required = true; if (options.autocomplete) input.autocomplete = options.autocomplete; wrap.append(label, input); return wrap;
}
function showNotice(message, kind = 'info') { state.notice = { message, kind }; render(); }
function noticeElement() { const box = node('div', `notice${state.notice?.kind === 'error' ? ' error' : state.notice?.kind === 'success' ? ' success' : ''}`, state.notice?.message || ''); box.hidden = !state.notice; box.setAttribute('role', state.notice?.kind === 'error' ? 'alert' : 'status'); return box; }
function setBusy(value) { state.busy = value; }
async function run(task, successMessage) { if (state.busy) return; setBusy(true); render(); try { await task(); state.notice = successMessage ? { message: successMessage, kind: 'success' } : null; } catch (error) { state.notice = { message: error.message, kind: 'error' }; } finally { setBusy(false); render(); } }

function render() {
  app.replaceChildren();
  if (!state.token || !state.user) { renderAuth(); return; }
  const shell = node('div', 'app-shell'); const sidebar = node('aside', 'sidebar');
  const brand = node('div', 'brand'); brand.append(document.createTextNode('xspresso')); const brandTail = node('span', '', ' workspace'); brand.append(brandTail); sidebar.append(brand);
  const nav = node('nav', 'nav-list'); nav.setAttribute('aria-label', 'Main navigation');
  for (const [key, label] of [['overview', 'Overview'], ['campaigns', 'Campaigns'], ['leads', 'Leads'], ['alerts', 'Alerts'], ['settings', 'Settings']]) { const b = node('button', 'nav-button', label); b.type = 'button'; b.dataset.view = key; if (state.view === key) b.setAttribute('aria-current', 'page'); nav.append(b); }
  sidebar.append(nav, node('div', 'sidebar-foot', 'AI drafts for you to review. Nothing launches without your approval.'));
  const work = node('div', 'workspace'); const top = node('header', 'topbar'); top.append(node('h1', '', viewTitle(state.view)));
  const actions = node('div', 'top-actions'); actions.append(node('span', 'user-label', state.user.name || state.user.email || 'Workspace')); actions.append(button('Sign out', 'logout', 'btn-quiet', true)); top.append(actions);
  const main = node('main', 'content'); main.id = 'main'; main.append(noticeElement()); renderView(main); work.append(top, main); shell.append(sidebar, work); app.append(shell); bindShellEvents();
}
function renderAuth() {
  const wrap = node('main', 'auth-wrap'); const card = node('section', 'auth-card'); const brand = node('div', 'brand'); brand.append(document.createTextNode('xspresso')); brand.append(node('span', '', ' workspace'));
  card.append(brand, node('h1', '', state.signup ? 'Create your workspace' : 'Welcome back'), node('p', 'muted', state.signup ? 'Start with a draft. You stay in control before anything goes live.' : 'Sign in to manage campaigns, leads, and review drafts.'));
  card.append(noticeElement()); const form = node('form'); form.id = 'auth-form';
  if (state.signup) form.append(field('Your name', 'auth-name', 'text', 'Name', { required: true, autocomplete: 'name' }));
  form.append(field('Email', 'auth-email', 'email', 'you@example.com', { required: true, autocomplete: 'email' }), field('Password', 'auth-password', 'password', 'At least 12 characters', { required: true, autocomplete: state.signup ? 'new-password' : 'current-password' }));
  const submit = node('button', 'btn btn-primary', state.busy ? 'Please wait…' : state.signup ? 'Create account' : 'Sign in'); submit.type = 'submit'; submit.disabled = state.busy; form.append(submit);
  form.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(form); void run(async () => { const result = state.signup ? await api.signup(data.get('auth-name'), data.get('auth-email'), data.get('auth-password')) : await api.login(data.get('auth-email'), data.get('auth-password')); acceptSession(result); await loadWorkspace(); }, 'Signed in successfully.'); });
  card.append(form); const toggle = node('p', 'hint'); toggle.append(document.createTextNode(state.signup ? 'Already have an account? ' : 'New to Xspresso? ')); const toggleButton = node('button', 'link-button', state.signup ? 'Sign in' : 'Create account'); toggleButton.type = 'button'; toggleButton.addEventListener('click', () => { state.signup = !state.signup; state.notice = null; render(); }); toggle.append(toggleButton); card.append(toggle); wrap.append(card); app.append(wrap);
}
function acceptSession(result) { if (!result?.token || !result?.user) throw new Error('Sign-in response was incomplete.'); state.token = result.token; state.user = result.user; sessionStorage.setItem(TOKEN_KEY, state.token); state.notice = null; }
function viewTitle(key) { return ({ overview: 'Overview', campaigns: 'Campaign workspace', leads: 'Leads', alerts: 'Monitoring alerts', settings: 'Workspace settings' })[key] || 'Xspresso'; }
function renderView(main) { if (state.view === 'overview') renderOverview(main); else if (state.view === 'campaigns') renderCampaigns(main); else if (state.view === 'leads') renderLeads(main); else if (state.view === 'alerts') renderAlerts(main); else renderSettings(main); }
function renderOverview(main) {
  main.append(node('h2', 'page-title', `Good to see you${state.user.name ? `, ${state.user.name}` : ''}`), node('p', 'page-subtitle', 'Your marketing stays under your control: Xspresso prepares drafts and insights; you decide what to change or approve.'));
  const stats = node('div', 'grid stats-grid'); for (const [label, value] of [['Campaigns', state.campaigns.length], ['Leads', state.leads.length], ['Available credits', state.credits]]) { const card = node('section', 'card stat-card'); card.append(node('div', 'stat-label', label), node('div', 'stat-value', value)); stats.append(card); } main.append(stats);
  const head = node('div', 'section-head'); head.append(node('h2', '', 'Recent campaigns'), button('Create a campaign', 'go-campaigns', 'btn-primary')); main.append(head);
  if (!state.campaigns.length) main.append(node('div', 'empty-state', 'No campaigns yet. Create one to start an editable AI draft.'));
  else main.append(campaignRows(state.campaigns.slice(0, 5)));
  const alertHead = node('div', 'section-head'); alertHead.append(node('h2', '', 'Open alerts'), button('View alerts', 'go-alerts')); main.append(alertHead);
  const open = state.alerts.filter(a => a.status !== 'resolved').slice(0, 3); main.append(open.length ? alertRows(open, false) : node('div', 'empty-state', 'No open alerts. Monitoring may need a platform metrics provider to be configured.'));
}
function campaignRows(rows) { const list = node('div', 'campaign-list'); for (const campaign of rows) { const row = node('div', 'list-row'); const info = node('div', 'row-main'); info.append(node('p', 'row-title', campaign.name || 'Untitled campaign'), node('div', 'row-meta', `${campaign.platform || 'general'} · ${campaign.goal || 'awareness'} · Updated ${formatDate(campaign.updatedAt || campaign.createdAt)}`)); const status = node('span', `pill${campaign.reviewStatus === 'approved' ? ' pill-approved' : ''}`, campaign.reviewStatus || campaign.status || 'draft'); const open = button('Review', 'open-campaign', 'btn-secondary', true); open.dataset.id = campaign.id; const right = node('div', 'section-actions'); right.append(status, open); row.append(info, right); list.append(row); } return list; }
function renderCampaigns(main) {
  main.append(node('h2', 'page-title', 'Campaigns'), node('p', 'page-subtitle', 'Create a brief, ask for an AI draft, edit it, and approve the exact version you want. Approval does not publish or spend ad budget.'));
  const split = node('div', 'split'); const left = node('section', 'card'); left.append(node('h2', '', 'New campaign'));
  const form = node('form'); form.id = 'campaign-form'; const grid = node('div', 'form-grid'); grid.append(field('Campaign name', 'campaign-name', 'text', 'Spring launch', { required: true }), field('Goal', 'campaign-goal', 'select', '', { options: [{ value: 'awareness', label: 'Awareness' }, { value: 'leads', label: 'Lead generation' }, { value: 'sales', label: 'Sales' }, { value: 'engagement', label: 'Engagement' }] }), field('Platform', 'campaign-platform', 'select', '', { options: [{ value: 'general', label: 'General draft' }, { value: 'meta', label: 'Meta' }, { value: 'google', label: 'Google' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'tiktok', label: 'TikTok' }, { value: 'email', label: 'Email' }] }), field('Product / offer', 'campaign-product', 'text', 'What are you promoting?', { required: true }), field('Audience', 'campaign-audience', 'text', 'Who is this for?'), field('Description and offer details', 'campaign-description', 'textarea', 'Only include accurate, verified details.', { full: true, rows: 4 }), field('Verified claims (one per line)', 'campaign-claims', 'textarea', 'Claims the AI is allowed to use.', { full: true, rows: 3 }));
  form.append(grid); const submit = node('button', 'btn btn-primary', state.busy ? 'Working…' : 'Create campaign'); submit.type = 'submit'; submit.disabled = state.busy; form.append(submit); form.addEventListener('submit', onCreateCampaign); left.append(form);
  const right = node('section', 'card'); right.append(node('h2', '', 'Your campaigns')); right.append(state.campaigns.length ? campaignRows(state.campaigns) : node('div', 'empty-state', 'Your campaigns will appear here.')); split.append(left, right); main.append(split);
  if (state.selectedCampaign) renderCampaignReview(main);
}
function renderCampaignReview(main) {
  const campaign = state.selectedCampaign; const card = node('section', 'card'); const head = node('div', 'section-head'); head.append(node('div', '', '')); const title = node('h2', '', `Review: ${campaign.name}`); head.replaceChildren(title, node('span', `pill${campaign.reviewStatus === 'approved' ? ' pill-approved' : ''}`, `Version ${state.draftVersion} · ${campaign.reviewStatus || 'needs review'}`)); card.append(head);
  const brief = campaign.brief || {}; card.append(node('p', 'hint', `${campaign.platform || 'general'} · ${campaign.goal || 'awareness'} · ${brief.productName || ''}`));
  const notes = field('Ideas or tweaks for the AI', 'generation-notes', 'textarea', 'Add direction for a new draft. Existing campaign information is used.', { rows: 3 }); card.append(notes);
  const tools = node('div', 'toolbar'); const generate = button(state.busy ? 'Generating…' : 'Generate / regenerate draft', 'generate', 'btn-primary'); generate.disabled = state.busy; const monitor = button('Refresh monitoring', 'monitor', 'btn-quiet'); monitor.dataset.id = campaign.id; tools.append(generate, monitor); card.append(tools);
  if (state.draft) {
    card.append(node('p', 'hint', 'Edit the JSON below, save to create a new version, then approve that version. Saving and approval do not publish anything.'));
    const editor = node('textarea', 'editor'); editor.id = 'draft-editor'; editor.setAttribute('aria-label', 'Campaign draft JSON'); editor.spellcheck = false; editor.value = JSON.stringify(state.draft, null, 2); card.append(editor);
    const actions = node('div', 'toolbar'); actions.append(button('Save edits', 'save-draft', 'btn-primary'), button('Approve this version', 'approve-draft', 'btn-secondary')); card.append(actions);
  } else card.append(node('div', 'empty-state', 'No generated draft is saved yet. Add optional notes and generate one.'));
  main.append(card);
}
async function onCreateCampaign(event) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const claims = String(data.get('campaign-claims') || '').split('\n').map(v => v.trim()).filter(Boolean); await run(async () => { const result = await api.createCampaign({ name: data.get('campaign-name'), goal: data.get('campaign-goal'), platform: data.get('campaign-platform'), brief: { productName: data.get('campaign-product'), description: data.get('campaign-description'), audience: data.get('campaign-audience'), verifiedClaims: claims } }); state.selectedCampaign = result.campaign; state.draft = null; state.draftVersion = 0; await refreshCampaigns(); }, 'Campaign created. Review the brief, then request a draft.'); }
function renderLeads(main) {
  main.append(node('h2', 'page-title', 'Leads'), node('p', 'page-subtitle', 'Follow-ups are scheduled only for leads with recorded consent. Use the form to add a lead only after receiving explicit permission.'));
  const card = node('section', 'card'); card.append(node('h2', '', 'Add a lead')); const form = node('form'); const grid = node('div', 'form-grid'); grid.append(field('Name', 'lead-name', 'text', 'Name'), field('Email', 'lead-email', 'email', 'person@example.com', { required: true })); form.append(grid); const check = node('label', 'check-row'); const consent = node('input'); consent.type = 'checkbox'; consent.name = 'lead-consent'; consent.required = true; check.append(consent, document.createTextNode(' I have explicit permission to store this contact and send the follow-up messages they agreed to receive.')); form.append(check); const submit = node('button', 'btn btn-primary', 'Add consented lead'); submit.type = 'submit'; form.append(submit); form.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(form); void run(async () => { await api.addLead({ name: data.get('lead-name'), email: data.get('lead-email'), consent: consent.checked, source: 'xspresso-dashboard' }); form.reset(); await refreshLeads(); }, 'Lead saved.'); }); card.append(form); main.append(card);
  const head = node('div', 'section-head'); head.append(node('h2', '', `Lead list (${state.leads.length})`)); main.append(head); if (!state.leads.length) main.append(node('div', 'empty-state', 'No leads in this workspace yet.')); else { const list = node('div', 'lead-list'); for (const lead of state.leads) { const row = node('div', 'list-row'); const info = node('div', 'row-main'); info.append(node('p', 'row-title', lead.name || lead.email), node('div', 'row-meta', `${lead.email} · ${lead.status || 'new'} · consent ${lead.consent ? 'recorded' : 'missing'}`)); row.append(info, node('span', `pill${lead.status === 'unsubscribed' ? '' : ' pill-approved'}`, lead.status || 'new')); list.append(row); } main.append(list); }
}
function renderAlerts(main) { main.append(node('h2', 'page-title', 'Monitoring alerts'), node('p', 'page-subtitle', 'Alerts are advisory. Xspresso will not pause or change campaigns automatically.'));
  const open = state.alerts.filter(a => a.status !== 'resolved'); const resolved = state.alerts.filter(a => a.status === 'resolved'); main.append(node('div', 'section-head', '')); const heading = main.lastChild; heading.replaceChildren(node('h2', '', `Open (${open.length})`)); main.append(open.length ? alertRows(open, true) : node('div', 'empty-state', 'No open alerts. If monitoring is not configured, connect a platform metrics provider first.'));
  const doneHead = node('div', 'section-head'); doneHead.append(node('h2', '', `Resolved (${resolved.length})`)); main.append(doneHead); if (resolved.length) main.append(alertRows(resolved.slice(0, 30), false));
}
function alertRows(rows, allowResolve) { const list = node('div', 'alert-list'); for (const alert of rows) { const row = node('article', 'list-row'); const info = node('div', 'row-main'); info.append(node('p', 'row-title', alert.title || alert.type || 'Campaign alert'), node('p', 'preline row-meta', alert.message || alert.recommendation || 'Review this campaign.')); const right = node('div', 'section-actions'); right.append(node('span', 'pill pill-open', alert.severity || alert.status || 'notice')); if (allowResolve) { const b = button('Resolve', 'resolve-alert', 'btn-quiet', true); b.dataset.id = alert.id; right.append(b); } row.append(info, right); list.append(row); } return list; }
function renderSettings(main) { main.append(node('h2', 'page-title', 'Workspace settings'), node('p', 'page-subtitle', 'Set defaults for new campaign drafts. These settings do not authorize publishing or external spend.'));
  const card = node('section', 'card'); const form = node('form'); const tone = field('Default writing tone', 'setting-tone', 'select', '', { options: [{ value: 'clear', label: 'Clear and direct' }, { value: 'friendly', label: 'Friendly' }, { value: 'professional', label: 'Professional' }, { value: 'playful', label: 'Playful' }] }); tone.querySelector('select').value = state.settings?.defaultTone || 'clear'; const platform = field('Default platform', 'setting-platform', 'select', '', { options: [{ value: 'general', label: 'General draft' }, { value: 'meta', label: 'Meta' }, { value: 'google', label: 'Google' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'tiktok', label: 'TikTok' }, { value: 'email', label: 'Email' }] }); platform.querySelector('select').value = state.settings?.defaultPlatform || 'general'; form.append(tone, platform); const row = node('label', 'check-row'); const checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.name = 'notificationsEnabled'; checkbox.checked = state.settings?.notificationsEnabled !== false; row.append(checkbox, document.createTextNode(' Show in-app notifications')); form.append(row); const save = node('button', 'btn btn-primary', 'Save settings'); save.type = 'submit'; form.append(save); form.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(form); void run(async () => { state.settings = (await api.saveSettings({ defaultTone: data.get('setting-tone'), defaultPlatform: data.get('setting-platform'), notificationsEnabled: checkbox.checked })).settings; }, 'Settings saved.'); }); card.append(form); main.append(card);
  const info = node('section', 'card'); info.append(node('h2', '', 'Account'), node('p', 'row-meta', state.user.email || ''), node('p', 'hint', 'Current session is held in this browser tab. Signing out clears the local session token.')); main.append(info);
}
function bindShellEvents() {
  app.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.view; state.notice = null; void loadViewData(); render(); }));
  app.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => handleAction(b)));
}
async function handleAction(b) {
  const action = b.dataset.action;
  if (action === 'logout') { await run(async () => { try { await api.logout(); } finally { signOutLocal(); state.selectedCampaign = null; state.view = 'overview'; render(); } }); return; }
  if (action === 'go-campaigns') { state.view = 'campaigns'; state.notice = null; render(); return; }
  if (action === 'go-alerts') { state.view = 'alerts'; render(); return; }
  if (action === 'open-campaign') { await run(async () => { const campaign = state.campaigns.find(c => c.id === b.dataset.id); if (!campaign) throw new Error('Campaign no longer exists.'); state.selectedCampaign = campaign; const result = await api.getDraft(campaign.id); state.draft = result.draft; state.draftVersion = result.version; state.selectedCampaign.reviewStatus = result.reviewStatus; }, 'Draft loaded for review.'); return; }
  if (action === 'generate') { await run(async () => { const notes = app.querySelector('#generation-notes')?.value || ''; const result = await api.generate(state.selectedCampaign.id, notes); state.draft = result.output; const loaded = await api.getDraft(state.selectedCampaign.id); state.draftVersion = loaded.version; await refreshCampaigns(); }, 'Draft generated. Review and edit it before approval.'); return; }
  if (action === 'save-draft') { await run(async () => { let draft; try { draft = JSON.parse(app.querySelector('#draft-editor').value); } catch { throw new Error('Draft editor must contain valid JSON.'); } const result = await api.saveDraft(state.selectedCampaign.id, state.draftVersion, draft); state.draft = result.draft; state.draftVersion = result.version; await refreshCampaigns(); }, 'Edits saved as a new version.'); return; }
  if (action === 'approve-draft') { if (!confirm('Approve this exact draft version? This will not publish or spend ad budget.')) return; await run(async () => { const result = await api.approveDraft(state.selectedCampaign.id, state.draftVersion); state.selectedCampaign.reviewStatus = result.reviewStatus; await refreshCampaigns(); }, 'Draft approved. It has not been published.'); return; }
  if (action === 'monitor') { await run(async () => { await api.monitor(state.selectedCampaign.id); await refreshAlerts(); }, 'Monitoring check completed.'); return; }
  if (action === 'resolve-alert') { await run(async () => { await api.resolveAlert(b.dataset.id); await refreshAlerts(); }, 'Alert resolved.'); return; }
}
async function refreshCampaigns() { state.campaigns = (await api.campaigns()).campaigns || []; if (state.selectedCampaign) state.selectedCampaign = state.campaigns.find(c => c.id === state.selectedCampaign.id) || state.selectedCampaign; }
async function refreshLeads() { state.leads = (await api.leads()).leads || []; }
async function refreshAlerts() { try { state.alerts = (await api.alerts()).alerts || []; } catch (error) { if (error.status !== 503 && error.status !== 404) throw error; state.alerts = []; } }
async function loadWorkspace() { await Promise.all([refreshCampaigns(), refreshLeads(), refreshAlerts(), api.credits().then(data => { state.credits = data.balance ?? 0; }).catch(() => { state.credits = 0; }), api.settings().then(data => { state.settings = data.settings; }).catch(() => {})]); state.view = 'overview'; render(); }
async function loadViewData() { try { if (state.view === 'campaigns') await refreshCampaigns(); if (state.view === 'leads') await refreshLeads(); if (state.view === 'alerts') await refreshAlerts(); if (state.view === 'settings') state.settings = (await api.settings()).settings; } catch (error) { state.notice = { message: error.message, kind: 'error' }; } }
function formatDate(value) { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(); }

async function boot() {
  if (!state.token) { render(); return; }
  try { const result = await api.me(); state.user = result.user; await loadWorkspace(); }
  catch { signOutLocal(); render(); }
}
void boot();
