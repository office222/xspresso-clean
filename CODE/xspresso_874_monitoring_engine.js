// xspresso_874_monitoring_engine.js
// Monitoring and alert rules for Xspresso.

export function evaluateAd(ad = {}) {
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const clicks = Number(ad.clicks || 0);
  const conversions = Number(ad.conversions || 0);

  const alerts = [];

  if (cpc >= 1.5) {
    alerts.push({
      level: 'warning',
      title: 'CPC is rising',
      message: 'This ad may need a tweak before more credits are spent.',
      recommendation: 'Try a new title or hook.'
    });
  }

  if (ctr > 0 && ctr < 0.8) {
    alerts.push({
      level: 'warning',
      title: 'CTR is low',
      message: 'This ad may need a stronger angle.',
      recommendation: 'Test a different creative or CTA.'
    });
  }

  if (clicks >= 20 && conversions === 0) {
    alerts.push({
      level: 'critical',
      title: 'Underperforming ad',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    });
  }

  return {
    status: alerts.length ? 'needs_attention' : 'healthy',
    alerts,
  };
}

export function buildMonitoringSummary(ad = {}) {
  const result = evaluateAd(ad);
  return {
    adName: ad.name || 'Untitled Ad',
    status: result.status,
    cpc: Number(ad.cpc || 0),
    ctr: Number(ad.ctr || 0),
    clicks: Number(ad.clicks || 0),
    conversions: Number(ad.conversions || 0),
    alerts: result.alerts,
  };
}
