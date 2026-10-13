// xspresso_734_monitoring_dashboard.js
// Monitoring / dashboard helpers for Xspresso.

export function evaluateAdHealth(ad) {
  const ctr = Number(ad.ctr || 0);
  const cpc = Number(ad.cpc || 0);
  const conversions = Number(ad.conversions || 0);
  const clicks = Number(ad.clicks || 0);

  if (conversions === 0 && clicks > 20) {
    return {
      status: 'underperforming',
      severity: 'critical',
      message: 'This ad is underperforming. Regenerate it before spending more credits.',
      recommendation: 'Try a new title, hook, or angle.'
    };
  }

  if (cpc > 1.5 || ctr < 0.8) {
    return {
      status: 'warning',
      severity: 'warning',
      message: 'This ad may need a tweak before you spend more credits.',
      recommendation: 'Test a new title or hook.'
    };
  }

  return {
    status: 'healthy',
    severity: 'info',
    message: 'This ad is performing well.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildDashboardSummary(state) {
  return {
    totalCampaigns: state.campaigns?.length || 0,
    activeCampaigns: (state.campaigns || []).filter((campaign) => campaign.status === 'live').length,
    drafts: (state.campaigns || []).filter((campaign) => campaign.status === 'draft').length,
    alerts: state.alerts?.length || 0,
    creditsRemaining: Math.max(0, (state.plan?.creditsIncluded || 0) - (state.plan?.creditsUsed || 0))
  };
}

export function buildCampaignCard(campaign) {
  return {
    id: campaign.id,
    name: campaign.brief?.productName || 'Untitled Campaign',
    status: campaign.status,
    platform: campaign.brief?.platform || 'general',
    updatedAt: campaign.updatedAt,
    approvedCount: campaign.approvedSections?.length || 0
  };
}

export function shouldWarnOnLowCredits(state) {
  const remaining = Math.max(0, (state.plan?.creditsIncluded || 0) - (state.plan?.creditsUsed || 0));
  return remaining <= Math.ceil((state.plan?.creditsIncluded || 0) * 0.2);
}
