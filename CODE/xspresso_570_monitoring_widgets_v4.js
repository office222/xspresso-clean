// Xspresso monitoring widgets
// File: xspresso_570_monitoring_widgets_v4.js

export function evaluateAdHealth(ad = {}) {
  const ctr = Number(ad.ctr || 0);
  const cpc = Number(ad.cpc || 0);
  const conversions = Number(ad.conversions || 0);
  const clicks = Number(ad.clicks || 0);

  if (conversions === 0 && clicks >= 20) {
    return {
      level: 'critical',
      status: 'underperforming',
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.',
    };
  }

  if (cpc >= 1.5 || ctr <= 0.8) {
    return {
      level: 'warning',
      status: 'watch',
      message: 'This ad may need a tweak.',
      recommendation: 'Test a new headline or hook.',
    };
  }

  return {
    level: 'info',
    status: 'healthy',
    message: 'This ad is performing normally.',
    recommendation: 'Keep monitoring.',
  };
}

export function buildMonitoringWidget(ad = {}) {
  const health = evaluateAdHealth(ad);
  return {
    id: ad.id,
    name: ad.name || 'Untitled Ad',
    platform: ad.platform || 'Unknown',
    status: health.status,
    level: health.level,
    message: health.message,
    recommendation: health.recommendation,
    cpc: ad.cpc ?? null,
    ctr: ad.ctr ?? null,
    conversions: ad.conversions ?? 0,
    clicks: ad.clicks ?? 0,
    impressions: ad.impressions ?? 0,
    monitoringStatus: ad.monitoringStatus || 'active',
  };
}

export function buildMonitoringAlert(ad = {}) {
  const health = evaluateAdHealth(ad);
  return {
    title: ad.name || 'Monitored ad',
    level: health.level,
    message: health.message,
    recommendation: health.recommendation,
  };
}