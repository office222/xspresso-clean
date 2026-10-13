// xspresso_652_dashboard_widgets_v9.js
// Dashboard widget helpers for Xspresso

export function buildDashboardWidgets({ campaigns = [], alerts = [], creditsRemaining = 0, monitoredAds = 0 }) {
  const activeCampaigns = campaigns.filter(c => c.status === 'live').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
  const underperformingCampaigns = campaigns.filter(c => c.health === 'underperforming').length;

  return [
    {
      id: 'active-campaigns',
      label: 'Active Campaigns',
      value: activeCampaigns,
      tone: activeCampaigns > 0 ? 'good' : 'neutral'
    },
    {
      id: 'drafts',
      label: 'Drafts',
      value: draftCampaigns,
      tone: draftCampaigns > 0 ? 'warn' : 'neutral'
    },
    {
      id: 'alerts',
      label: 'Alerts',
      value: alerts.length,
      tone: alerts.length > 0 ? 'warn' : 'good'
    },
    {
      id: 'credits-remaining',
      label: 'Credits Remaining',
      value: creditsRemaining,
      tone: creditsRemaining < 100 ? 'warn' : 'good'
    },
    {
      id: 'monitored-ads',
      label: 'Monitored Ads',
      value: monitoredAds,
      tone: monitoredAds > 0 ? 'good' : 'neutral'
    },
    {
      id: 'underperforming',
      label: 'Needs Attention',
      value: underperformingCampaigns,
      tone: underperformingCampaigns > 0 ? 'bad' : 'good'
    }
  ];
}

export function buildCampaignCardSummary(campaign) {
  return {
    id: campaign.id,
    name: campaign.name || 'Untitled Campaign',
    status: campaign.status || 'draft',
    platform: campaign.platform || 'Multiple',
    cpc: campaign.cpc ?? 0,
    ctr: campaign.ctr ?? 0,
    conversions: campaign.conversions ?? 0,
    monitoringStatus: campaign.monitoringStatus || 'active',
    alertCount: campaign.alertCount ?? 0
  };
}

export function getWidgetTone(value, type = 'count') {
  if (type === 'credits' && value < 100) return 'warn';
  if (type === 'alerts' && value > 0) return 'warn';
  if (value === 0) return 'neutral';
  return 'good';
}

export function sortCampaignsForDashboard(campaigns = []) {
  return [...campaigns].sort((a, b) => {
    const aNeedsHelp = a.health === 'underperforming' ? 1 : 0;
    const bNeedsHelp = b.health === 'underperforming' ? 1 : 0;
    return bNeedsHelp - aNeedsHelp || (b.updatedAt || '').localeCompare(a.updatedAt || '');
  });
}
