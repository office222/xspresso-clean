// xspresso_883_dashboard_render.js
import { buildMonitoringSummary } from './xspresso_882_monitoring_alerts.js';

export function renderDashboard(state) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const summaryCards = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'live').length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining: state.user?.creditsRemaining || 0,
    monitoredAds: campaigns.filter(c => c.monitoringEnabled).length
  };

  const campaignCards = campaigns.map(campaign => {
    const monitoring = buildMonitoringSummary(campaign);
    return {
      id: campaign.id,
      name: campaign.brief?.productName || campaign.name || 'Untitled Campaign',
      status: campaign.status,
      platform: campaign.platform || 'general',
      cpc: campaign.cpc || 0,
      ctr: campaign.ctr || 0,
      conversions: campaign.conversions || 0,
      monitoringStatus: monitoring.status,
      alertCount: monitoring.alerts.length
    };
  });

  return {
    summaryCards,
    campaignCards,
    recentAlerts: alerts.slice(0, 5),
    recentNotifications: (state.notifications || []).slice(0, 5)
  };
}

export function renderDashboardHtml(model) {
  const cards = model.campaignCards.map(card => `
    <section class="card">
      <h3>${card.name}</h3>
      <p>Status: ${card.status}</p>
      <p>Platform: ${card.platform}</p>
      <p>CPC: ${card.cpc}</p>
      <p>CTR: ${card.ctr}</p>
      <p>Conversions: ${card.conversions}</p>
      <p>Monitoring: ${card.monitoringStatus}</p>
      <p>Alerts: ${card.alertCount}</p>
    </section>
  `).join('');

  return `
    <div class="dashboard-shell">
      <div class="summary-grid">
        <div class="summary-card">${model.summaryCards.totalCampaigns} Campaigns</div>
        <div class="summary-card">${model.summaryCards.activeCampaigns} Active</div>
        <div class="summary-card">${model.summaryCards.drafts} Drafts</div>
        <div class="summary-card">${model.summaryCards.alerts} Alerts</div>
        <div class="summary-card">${model.summaryCards.creditsRemaining} Credits Left</div>
        <div class="summary-card">${model.summaryCards.monitoredAds} Monitored</div>
      </div>
      <div class="campaign-grid">${cards}</div>
    </div>
  `;
}
