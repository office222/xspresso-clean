// xspresso_815_monitoring_alerts_panel_v3.js
// Monitoring and alert helpers for Xspresso.

export function evaluateAdHealth(ad = {}) {
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const conversions = Number(ad.conversions || 0);
  const clicks = Number(ad.clicks || 0);

  if (conversions === 0 && clicks > 20) {
    return {
      status: 'underperforming',
      level: 'critical',
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    };
  }

  if (cpc >= 1.5) {
    return {
      status: 'warning',
      level: 'warning',
      message: 'CPC is rising.',
      recommendation: 'Try a new headline, hook, or angle.'
    };
  }

  if (ctr > 0 && ctr < 0.8) {
    return {
      status: 'warning',
      level: 'warning',
      message: 'CTR is low.',
      recommendation: 'Improve the hook or headline before spending more credits.'
    };
  }

  return {
    status: 'healthy',
    level: 'info',
    message: 'This ad is performing acceptably.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildAlert(ad = {}) {
  const health = evaluateAdHealth(ad);
  return {
    id: `alert_${Date.now()}`,
    campaignId: ad.campaignId || null,
    adId: ad.id || null,
    title: health.message,
    message: health.recommendation,
    level: health.level,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}
