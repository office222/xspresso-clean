// Xspresso - Monitoring Engine v14
// Evaluates ad performance, generates alerts, and recommends next actions.

function evaluateAd(ad = {}) {
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const clicks = Number(ad.clicks || 0);
  const conversions = Number(ad.conversions || 0);

  const issues = [];
  if (cpc >= 1.5) issues.push('CPC is rising');
  if (ctr > 0 && ctr < 0.8) issues.push('CTR is low');
  if (clicks >= 20 && conversions === 0) issues.push('Clicks without conversions');
  if (!ad.active) issues.push('Ad is not active');

  const underperforming = issues.length > 0;

  return {
    id: ad.id || `ad_${Date.now()}`,
    name: ad.name || 'Untitled Ad',
    underperforming,
    issues,
    cpc,
    ctr,
    clicks,
    conversions,
    recommendation: underperforming
      ? 'Improve it before spending more credits monitoring an ad that is not performing.'
      : 'Keep monitoring.'
  };
}

function recommendFix(adEval) {
  if (!adEval.underperforming) {
    return {
      primaryAction: 'Keep monitoring',
      secondaryActions: ['Review later', 'Continue as-is']
    };
  }

  return {
    primaryAction: 'Regenerate this ad',
    secondaryActions: ['Rewrite the title', 'Test a new hook', 'Try a different angle', 'Change the CTA']
  };
}

function buildAlert(adEval) {
  if (!adEval.underperforming) return null;
  return {
    title: adEval.name,
    level: 'warning',
    message: adEval.recommendation,
    issues: adEval.issues,
    action: 'Regenerate this ad'
  };
}

function monitorCampaign(campaign = {}) {
  const ads = Array.isArray(campaign.ads) ? campaign.ads : [];
  const evaluations = ads.map(evaluateAd);
  const alerts = evaluations.map(buildAlert).filter(Boolean);
  const healthy = evaluations.filter((e) => !e.underperforming).length;

  return {
    campaignId: campaign.id || `cmp_${Date.now()}`,
    totalAds: ads.length,
    healthyAds: healthy,
    alertCount: alerts.length,
    alerts,
    evaluations
  };
}

module.exports = {
  evaluateAd,
  recommendFix,
  buildAlert,
  monitorCampaign
};
