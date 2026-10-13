// xspresso_839_dashboard_cards.js
import { money } from './xspresso_837_utils.js';

export function buildDashboardSummary(state = {}) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const credits = state.credits || { included: 0, used: 0 };

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'live').length,
    drafts: campaigns.filter((c) => c.status === 'draft').length,
    alerts: alerts.length,
    creditsRemaining: Math.max(0, (credits.included || 0) - (credits.used || 0)),
    creditsUsed: credits.used || 0
  };
}

export function campaignCard(campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status || 'draft',
    platform: campaign.platform || 'general',
    cpc: money(campaign.cpc || 0),
    ctr: `${Number(campaign.ctr || 0).toFixed(2)}%`,
    conversions: campaign.conversions || 0,
    monitoring: campaign.monitoringStatus || 'active',
    alerts: campaign.alerts || 0
  };
}

export function alertCard(alert) {
  return {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    level: alert.level || 'info',
    createdAt: alert.createdAt || new Date().toISOString()
  };
}
