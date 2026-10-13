window.XspressoMonitoring = (() => {
  function evaluateCampaign(campaign) {
    const alerts = [];

    if (campaign.conversions === 0 && campaign.cpc > 1.5) {
      alerts.push({
        id: `alt_${campaign.id}_underperforming`,
        campaignId: campaign.id,
        title: 'This ad is underperforming',
        message: 'Improve it before spending more credits monitoring an ad that is not performing.',
        level: 'critical',
        action: 'Regenerate this ad with a new title, hook, or angle.'
      });
    }

    if (campaign.cpc >= 1.5) {
      alerts.push({
        id: `alt_${campaign.id}_cpc`,
        campaignId: campaign.id,
        title: 'CPC is rising',
        message: 'This campaign may need a tweak before you spend more credits.',
        level: 'warning',
        action: 'Try a new headline or hook.'
      });
    }

    if (campaign.ctr !== undefined && campaign.ctr < 0.8) {
      alerts.push({
        id: `alt_${campaign.id}_ctr`,
        campaignId: campaign.id,
        title: 'CTR is low',
        message: 'Test a new title, hook, or angle before continuing monitoring.',
        level: 'warning',
        action: 'Regenerate the ad.'
      });
    }

    return alerts;
  }

  function buildDashboard(user, campaigns, alerts) {
    return {
      userName: user.name,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'live').length,
      drafts: campaigns.filter(c => c.status === 'draft').length,
      alerts: alerts.length,
      creditsRemaining: user.creditsRemaining,
      monitoredAds: campaigns.reduce((sum, c) => sum + (c.monitoredAds || 0), 0),
      campaigns,
      alertsList: alerts
    };
  }

  function monitoringSummaryText(campaign) {
    if (campaign.conversions === 0 && campaign.cpc > 1.5) {
      return 'Improve it before spending more credits.';
    }
    return 'Keep monitoring and watch for changes.';
  }

  return {
    evaluateCampaign,
    buildDashboard,
    monitoringSummaryText
  };
})();
