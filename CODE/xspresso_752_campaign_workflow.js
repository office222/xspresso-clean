// xspresso_752_campaign_workflow.js
export function renderCampaignWorkflow(state, store) {
  const current = state.currentDraft || {
    productName: '',
    productUrl: '',
    audience: '',
    goal: 'sales',
    tone: 'simple',
    platform: 'general'
  };

  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <img src="images/Xspresso_cup.gif" alt="Xspresso cup">
          <div>
            <div class="brand-title">Campaign Builder</div>
            <div class="brand-subtitle">Turn a brief into a draft.</div>
          </div>
        </div>
        <div class="nav">
          <button onclick="window.xspresso.go('dashboard')">Dashboard</button>
          <button class="primary" onclick="window.xspresso.go('monitoring')">Monitoring</button>
        </div>
      </header>
      <main class="content">
        <div class="grid">
          <section class="card full">
            <div class="section-title">
              <h2>Brief</h2>
              <span class="tag">Add an offer</span>
            </div>
            <div class="grid">
              <div class="card" style="grid-column: span 6; box-shadow:none;">
                <label>Product Name</label>
                <input id="productName" value="${escapeHtml(current.productName)}" placeholder="Product name">
                <label style="margin-top:12px;display:block;">Product URL</label>
                <input id="productUrl" value="${escapeHtml(current.productUrl)}" placeholder="https://...">
                <label style="margin-top:12px;display:block;">Audience</label>
                <input id="audience" value="${escapeHtml(current.audience)}" placeholder="Who is this for?">
              </div>
              <div class="card" style="grid-column: span 6; box-shadow:none;">
                <label>Goal</label>
                <select id="goal">
                  ${selectOptions(['sales','leads','clicks','list'], current.goal)}
                </select>
                <label style="margin-top:12px;display:block;">Tone</label>
                <select id="tone">
                  ${selectOptions(['simple','friendly','bold','premium','direct','persuasive'], current.tone)}
                </select>
                <label style="margin-top:12px;display:block;">Platform</label>
                <select id="platform">
                  ${selectOptions(['general','facebook','instagram','tiktok','youtube','google'], current.platform)}
                </select>
              </div>
            </div>
            <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
              <button class="btn primary" onclick="window.xspresso.generateDraft()">Generate Draft</button>
              <button class="btn" onclick="window.xspresso.go('dashboard')">Back to Dashboard</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  `;
}

function selectOptions(options, selected) {
  return options.map(opt => `<option value="${opt}" ${opt === selected ? 'selected' : ''}>${opt}</option>`).join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
