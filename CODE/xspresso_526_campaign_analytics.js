// xspresso_526_campaign_analytics.js
// Campaign analytics helpers for Xspresso V1

export function summarizeCampaignMetrics(campaigns = []) {
  const summary = {
    totalCampaigns: campaigns.length,
    activeCampaigns: 0,
    drafts: 0,
    alerts: 0,
    monitoredAds: 0,
    totalClicks: 0,
    totalConversions: 0,
    averageCpc: 0,
  };

  let cpcSum = 0;
  let cpcCount = 0;

  for (const campaign of campaigns) {
    if (campaign.status === "live") summary.activeCampaigns += 1;
    if (campaign.status === "draft") summary.drafts += 1;
    summary.alerts += campaign.alerts || 0;
    summary.monitoredAds += campaign.monitoredAds || 0;
    summary.totalClicks += campaign.clicks || 0;
    summary.totalConversions += campaign.conversions || 0;

    if (typeof campaign.cpc === "number") {
      cpcSum += campaign.cpc;
      cpcCount += 1;
    }
  }

  summary.averageCpc = cpcCount ? Number((cpcSum / cpcCount).toFixed(2)) : 0;
  return summary;
}

export function buildKpiCards(summary) {
  return [
    { label: "Campaigns", value: summary.totalCampaigns },
    { label: "Active", value: summary.activeCampaigns },
    { label: "Drafts", value: summary.drafts },
    { label: "Alerts", value: summary.alerts },
    { label: "Monitored Ads", value: summary.monitoredAds },
    { label: "Avg CPC", value: summary.averageCpc },
  ];
}

export function getCampaignTrend(campaign) {
  const conversions = campaign.conversions || 0;
  const clicks = campaign.clicks || 0;
  const cpc = campaign.cpc || 0;

  if (conversions > 0 && cpc <= 1.5) return "healthy";
  if (clicks > 20 && conversions === 0) return "underperforming";
  return "watch";
}
