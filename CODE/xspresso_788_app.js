const state = {
  view: 'dashboard',
  credits: 480,
  plan: 'Pro',
  campaigns: [
    { id: 1, name: 'Jones Street Pub', status: 'live', platform: 'TikTok', cpc: 1.42, ctr: 0.8, conversions: 2, alerts: 1 },
    { id: 2, name: 'Light Touch Body Cream', status: 'draft', platform: 'Facebook', cpc: 0.89, ctr: 1.2, conversions: 0, alerts: 0 }
  ],
  alerts: [
    { id: 1, title: 'CPC is rising', message: 'Jones Street Pub may need a headline tweak.', level: 'warning' }
  ],
  leads: [
    { id: 1, name: 'Jamie', score: 35, list: 'warm' },
    { id: 2, name: 'Taylor', score: 8, list: 'cold' }
  ],
  templates: [
    { id: 1, name: 'Product Launch Template' },
    { id: 2, name: 'Lead Magnet Template' }
  ]
};

const appView = document.getElementById('appView');
const navItems = [...document.querySelectorAll('.nav-item')];

document.getElementById('btnCreate')?.addEventListener('click', () => setView('builder'));
document.getElementById('heroDemo')?.addEventListener('click', () => setView('builder'));
document.getElementById('heroPricing')?.addEventListener('click', () => renderPricing());
document.getElementById('btnHelp')?.addEventListener('click', () => setView('help'));
navItems.forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));

function setView(view) {
  state.view = view;
  navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  render();
}

function evaluateAd(campaign) {
  if (campaign.conversions === 0 && campaign.cpc > 1) {
    return {
      level: 'red',
      title: 'Underperforming ad',
      message: 'Regenerate this ad before spending more credits.'
    };
  }
  if (campaign.cpc > 1.3) {
    return {
      level: 'red',
      title: 'CPC is rising',
      message: 'Try a new title, hook, or angle.'
    };
  }
  return {
    level: 'green',
    title: 'Healthy',
    message: 'This campaign is performing acceptably.'
  };
}

function dashboardView() {
  const active = state.campaigns.filter(c => c.status === 'live').length;
  const draftCount = state.campaigns.filter(c => c.status === 'draft').length;
  const monitored = state.campaigns.length;
  return `
    <div class="grid-3">
      <div class="card"><div class="muted">Active campaigns</div><div class="kpi">${active}</div></div>
      <div class="card"><div class="muted">Drafts</div><div class="kpi">${draftCount}</div></div>
      <div class="card"><div class="muted">Credits remaining</div><div class="kpi">${state.credits}</div></div>
    </div>
    <div class="card">
      <div class="section-title"><h2>Campaigns</h2><span class="badge">${monitored} tracked</span></div>
      <div class="list">
        ${state.campaigns.map(c => {
          const health = evaluateAd(c);
          return `
            <div class="row">
              <div>
                <strong>${c.name}</strong>
                <small>${c.platform} · CPC ${c.cpc} · CTR ${c.ctr}% · Conversions ${c.conversions}</small>
              </div>
              <div style="text-align:right">
                <span class="badge ${health.level === 'red' ? 'red' : 'green'}">${health.title}</span>
                <div class="muted" style="margin-top:6px">${health.message}</div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>
    <div class="card">
      <div class="section-title"><h2>Recent alerts</h2><span class="badge red">${state.alerts.length} open</span></div>
      <div class="list">${state.alerts.map(a => `<div class="row"><div><strong>${a.title}</strong><small>${a.message}</small></div><button class="btn btn-secondary">View</button></div>`).join('')}</div>
    </div>
  `;
}

function builderView() {
  return `
    <div class="card">
      <div class="section-title"><h2>Campaign Builder</h2><span class="badge">Done-for-you</span></div>
      <div class="form">
        <div class="field"><label>Product name</label><input placeholder="Enter your offer name" /></div>
        <div class="field"><label>Offer description</label><textarea placeholder="Tell Xspresso what you are selling..."></textarea></div>
        <div class="grid-3">
          <div class="field"><label>Goal</label><select><option>Sales</option><option>Leads</option><option>Clicks</option><option>List building</option></select></div>
          <div class="field"><label>Tone</label><select><option>Simple</option><option>Friendly</option><option>Bold</option><option>Premium</option></select></div>
          <div class="field"><label>Platform</label><select><option>General</option><option>Facebook</option><option>TikTok</option><option>Google</option></select></div>
        </div>
        <div class="actions"><button class="btn btn-primary">Generate Draft</button><button class="btn btn-secondary">Use Template</button></div>
      </div>
    </div>
  `;
}

function monitoringView() {
  return `
    <div class="card">
      <div class="section-title"><h2>Monitoring</h2><span class="badge red">1 alert</span></div>
      <div class="list">${state.campaigns.map(c => {
        const health = evaluateAd(c);
        return `<div class="row"><div><strong>${c.name}</strong><small>${health.message}</small></div><span class="badge ${health.level === 'red' ? 'red' : 'green'}">${health.title}</span></div>`;
      }).join('')}</div>
    </div>
  `;
}

function leadsView() {
  return `
    <div class="card">
      <div class="section-title"><h2>Leads</h2><span class="badge">${state.leads.length} contacts</span></div>
      <div class="list">${state.leads.map(l => `<div class="row"><div><strong>${l.name}</strong><small>${l.score} score · ${l.list} list</small></div><button class="btn btn-secondary">Follow up</button></div>`).join('')}</div>
    </div>
  `;
}

function libraryView() {
  return `
    <div class="card"><div class="section-title"><h2>Library</h2><span class="badge">Saved work</span></div><div class="muted">Save, duplicate, and restore your own campaigns here.</div></div>
  `;
}

function templatesView() {
  return `
    <div class="card"><div class="section-title"><h2>Templates</h2><span class="badge">${state.templates.length} presets</span></div>${state.templates.map(t => `<div class="row"><div><strong>${t.name}</strong><small>Start faster from a proven structure</small></div><button class="btn btn-secondary">Use</button></div>`).join('')}</div>
  `;
}

function creditsView() {
  return `
    <div class="grid-3">
      <div class="card"><div class="muted">Plan</div><div class="kpi">${state.plan}</div></div>
      <div class="card"><div class="muted">Credits remaining</div><div class="kpi">${state.credits}</div></div>
      <div class="card"><div class="muted">Fair usage</div><div class="kpi">OK</div></div>
    </div>
  `;
}

function billingView() {
  return `
    <div class="card"><div class="section-title"><h2>Billing</h2><span class="badge">All tools included</span></div><div class="muted">Credits determine usage. Need more? Add credits anytime.</div></div>
  `;
}

function settingsView() {
  return `
    <div class="card"><div class="section-title"><h2>Settings</h2><span class="badge">Simple defaults</span></div><div class="muted">Configure monitoring thresholds, tone, and default platform behavior.</div></div>
  `;
}

function helpView() {
  return `
    <div class="card"><div class="section-title"><h2>Help</h2><span class="badge">Need help?</span></div><div class="muted">Find answers for getting started, monitoring, billing, credits, and platform switching.</div></div>
  `;
}

function renderPricing() {
  appView.innerHTML = `
    <div class="card">
      <div class="section-title"><h2>Pricing</h2><span class="badge">Fair usage</span></div>
      <p class="muted">All plans include every tool. Credits simply determine fair usage.</p>
      <div class="grid-3" style="margin-top:16px">
        <div class="card"><h3>Starter</h3><div class="kpi">$29</div><p>Great for getting started.</p></div>
        <div class="card"><h3>Pro</h3><div class="kpi">$49</div><p>Best value for active marketers.</p></div>
        <div class="card"><h3>Business</h3><div class="kpi">$99</div><p>For higher volume users.</p></div>
      </div>
    </div>`;
}

function render() {
  const views = {
    dashboard: dashboardView,
    builder: builderView,
    monitoring: monitoringView,
    leads: leadsView,
    library: libraryView,
    templates: templatesView,
    credits: creditsView,
    billing: billingView,
    settings: settingsView,
    help: helpView
  };
  appView.innerHTML = views[state.view] ? views[state.view]() : dashboardView();
}

render();
