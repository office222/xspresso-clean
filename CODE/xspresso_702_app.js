const state = {
  credits: 500,
  plan: 'Starter',
  campaigns: [],
  alerts: [],
  leads: [],
  templates: []
};

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function createCampaignBrief(input = {}) {
  return {
    id: `cmp_${Date.now()}`,
    productName: input.productName || 'Untitled Offer',
    description: input.description || 'A product or offer needing a campaign',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    status: 'draft',
    headline: 'Wake up your marketing.',
    subheadline: 'More responses. Less software chaos.',
    hooks: [
      'Done-for-you marketing that gets responses.',
      'You stay in command. We do the work.'
    ],
    createdAt: new Date().toISOString()
  };
}

function evaluateAd(campaign) {
  const cpc = campaign.cpc ?? 1.42;
  const ctr = campaign.ctr ?? 0.8;
  const conversions = campaign.conversions ?? 0;
  const clicks = campaign.clicks ?? 0;

  if (conversions === 0 && clicks > 20) {
    return {
      level: 'critical',
      title: 'This ad is underperforming.',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      action: 'Regenerate this ad with a new title, hook, or angle.'
    };
  }

  if (cpc > 1.5 || ctr < 0.8) {
    return {
      level: 'warning',
      title: 'This ad may need a tweak.',
      message: 'Try a new headline, hook, or angle before using more credits.',
      action: 'Regenerate section'
    };
  }

  return {
    level: 'good',
    title: 'This ad is performing well.',
    message: `CPC ${money(cpc)} / CTR ${ctr}%`,
    action: 'Keep monitoring'
  };
}

function renderDashboardCards() {
  const container = document.getElementById('dashboardCards');
  if (!container) return;

  const cards = [
    ['Plan', state.plan],
    ['Credits', state.credits],
    ['Campaigns', state.campaigns.length],
    ['Alerts', state.alerts.length]
  ];

  container.innerHTML = cards.map(([title, value]) => `
    <div class="small-card">
      <h3>${title}</h3>
      <p>${value}</p>
    </div>
  `).join('');
}

function renderBuilderForm() {
  const container = document.getElementById('builderForm');
  if (!container) return;

  container.innerHTML = `
    <div class="form-row">
      <input id="productName" class="input" placeholder="Product name" />
      <input id="audience" class="input" placeholder="Audience" />
    </div>
    <div class="form-row" style="margin-top:12px;">
      <select id="goal" class="select">
        <option value="sales">Sales</option>
        <option value="leads">Leads</option>
        <option value="clicks">Clicks</option>
        <option value="list">Build a list</option>
      </select>
      <select id="tone" class="select">
        <option value="simple">Simple</option>
        <option value="friendly">Friendly</option>
        <option value="bold">Bold</option>
        <option value="premium">Premium</option>
      </select>
    </div>
    <div class="form-row" style="margin-top:12px;">
      <textarea id="description" class="textarea" placeholder="Offer description"></textarea>
      <textarea id="notes" class="textarea" placeholder="Notes"></textarea>
    </div>
    <div class="actions">
      <button class="btn primary" id="generateDraftBtn">Generate Draft</button>
      <button class="btn secondary" id="saveTemplateBtn">Save as Template</button>
    </div>
    <div id="builderResult" style="margin-top:18px;"></div>
  `;

  document.getElementById('generateDraftBtn').addEventListener('click', () => {
    const campaign = createCampaignBrief({
      productName: document.getElementById('productName').value,
      audience: document.getElementById('audience').value,
      goal: document.getElementById('goal').value,
      tone: document.getElementById('tone').value,
      description: document.getElementById('description').value
    });
    state.campaigns.unshift(campaign);
    state.alerts.unshift(evaluateAd(campaign));
    renderDashboardCards();
    renderMonitoringPanel();
    renderBuilderResult(campaign);
  });

  document.getElementById('saveTemplateBtn').addEventListener('click', () => {
    const campaign = createCampaignBrief({
      productName: document.getElementById('productName').value,
      audience: document.getElementById('audience').value,
      goal: document.getElementById('goal').value,
      tone: document.getElementById('tone').value,
      description: document.getElementById('description').value
    });
    state.templates.unshift(campaign);
    alert('Template saved.');
  });
}

function renderBuilderResult(campaign) {
  const result = document.getElementById('builderResult');
  if (!result) return;

  result.innerHTML = `
    <div class="small-card">
      <span class="badge">Draft ready</span>
      <h3 style="margin-top:10px;">${campaign.headline}</h3>
      <p>${campaign.subheadline}</p>
      <ul class="list">
        <li>${campaign.hooks[0]}</li>
        <li>${campaign.hooks[1]}</li>
        <li>Goal: ${campaign.goal}</li>
        <li>Tone: ${campaign.tone}</li>
      </ul>
    </div>
  `;
}

function renderMonitoringPanel() {
  const container = document.getElementById('monitoringPanel');
  if (!container) return;

  const campaign = state.campaigns[0];
  if (!campaign) {
    container.innerHTML = '<p class="lead">No campaigns yet. Generate a draft to start monitoring.</p>';
    return;
  }

  const health = evaluateAd(campaign);
  container.innerHTML = `
    <div class="small-card">
      <span class="badge">${health.level.toUpperCase()}</span>
      <h3 style="margin-top:10px;">${health.title}</h3>
      <p>${health.message}</p>
      <p><strong>Next action:</strong> ${health.action}</p>
    </div>
  `;
}

function renderBillingPanel() {
  const container = document.getElementById('billingPanel');
  if (!container) return;

  container.innerHTML = `
    <div class="small-card">
      <h3>${state.plan}</h3>
      <p>Credits remaining: <strong>${state.credits}</strong></p>
      <p>All plans include every tool. Credits simply determine fair usage.</p>
      <div class="actions">
        <button class="btn primary">Add Credits</button>
        <button class="btn secondary">See Plans</button>
      </div>
    </div>
  `;
}

function initApp() {
  renderDashboardCards();
  renderBuilderForm();
  renderMonitoringPanel();
  renderBillingPanel();

  const demoBtn = document.getElementById('demoBtn');
  const pricingBtn = document.getElementById('pricingBtn');
  if (demoBtn) demoBtn.addEventListener('click', () => alert('Demo coming next.'));
  if (pricingBtn) pricingBtn.addEventListener('click', () => document.getElementById('billing').scrollIntoView({ behavior: 'smooth' }));
}

document.addEventListener('DOMContentLoaded', initApp);
