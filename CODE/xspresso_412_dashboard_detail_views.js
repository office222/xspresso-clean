// xspresso_412_dashboard_detail_views.js
// Dashboard detail views for Xspresso.

export function buildCampaignSummary(campaign) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    monitoredAds: campaign.monitoredAds || 0,
    alerts: campaign.alerts || 0,
    lastUpdated: campaign.lastUpdated || new Date().toISOString(),
  };
}

export function getStatusBadge(status) {
  switch (status) {
    case 'live':
      return { label: 'Live', color: 'green' };
    case 'draft':
      return { label: 'Draft', color: 'gray' };
    case 'needs_attention':
      return { label: 'Needs Attention', color: 'orange' };
    case 'underperforming':
      return { label: 'Underperforming', color: 'red' };
    case 'paused':
      return { label: 'Paused', color: 'blue' };
    default:
      return { label: 'Unknown', color: 'gray' };
  }
}

export function renderDashboardDetail(campaigns = [], alerts = [], creditsRemaining = 0) {
  const campaignCards = campaigns.map((campaign) => {
    const badge = getStatusBadge(campaign.status);
    return `
      <article class="campaign-card">
        <div class="campaign-card-head">
          <h3>${campaign.name}</h3>
          <span class="badge badge-${badge.color}">${badge.label}</span>
        </div>
        <p><strong>Platform:</strong> ${campaign.platform || 'Multiple'}</p>
        <p><strong>CPC:</strong> ${campaign.cpc || 0}</p>
        <p><strong>CTR:</strong> ${campaign.ctr || 0}%</p>
        <p><strong>Conversions:</strong> ${campaign.conversions || 0}</p>
        <p><strong>Monitored Ads:</strong> ${campaign.monitoredAds || 0}</p>
        <p><strong>Alerts:</strong> ${campaign.alerts || 0}</p>
        <div class="campaign-card-actions">
          <button type="button">View</button>
          <button type="button">Edit</button>
          <button type="button">Duplicate</button>
          <button type="button">Regenerate</button>
        </div>
      </article>
    `;
  }).join('');

  const alertRows = alerts.map((alert) => `
    <div class="alert-row alert-${alert.level || 'warning'}">
      <strong>${alert.title}</strong>
      <p>${alert.message}</p>
    </div>
  `).join('');

  return `
    <section class="panel dashboard-detail-panel">
      <h2>Dashboard Overview</h2>
      <div class="dashboard-stats">
        <div class="stat"><strong>${campaigns.length}</strong><span>Campaigns</span></div>
        <div class="stat"><strong>${alerts.length}</strong><span>Alerts</span></div>
        <div class="stat"><strong>${creditsRemaining}</strong><span>Credits Left</span></div>
      </div>
      <div class="campaign-card-grid">
        ${campaignCards || '<p>No campaigns yet.</p>'}
      </div>
      <div class="alert-feed">
        <h3>Recent Alerts</h3>
        ${alertRows || '<p>No alerts.</p>'}
      </div>
    </section>
  `;
}
