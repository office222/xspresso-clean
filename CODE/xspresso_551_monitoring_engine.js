// xspresso_551_monitoring_engine.js
// Monitoring engine scaffolding for Xspresso V1.

export const MonitoringStatus = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  UNDERPERFORMING: 'underperforming',
  PAUSED: 'paused',
  NEEDS_REVIEW: 'needs_review'
};

export function evaluateAdPerformance(ad = {}) {
  const ctr = Number(ad.ctr || 0);
  const cpc = Number(ad.cpc || 0);
  const conversions = Number(ad.conversions || 0);
  const clicks = Number(ad.clicks || 0);

  if (ad.paused) {
    return {
      status: MonitoringStatus.PAUSED,
      message: 'This ad is paused.',
      recommendation: 'Resume or keep paused.'
    };
  }

  if (conversions === 0 && clicks >= 20) {
    return {
      status: MonitoringStatus.UNDERPERFORMING,
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    };
  }

  if (cpc >= 1.5 || ctr <= 0.8) {
    return {
      status: MonitoringStatus.WARNING,
      message: 'This ad may need a tweak.',
      recommendation: 'Test a new headline or hook.'
    };
  }

  return {
    status: MonitoringStatus.HEALTHY,
    message: 'This ad is performing well.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildMonitoringSnapshot(ad = {}) {
  const evaluation = evaluateAdPerformance(ad);
  return {
    adId: ad.id || null,
    name: ad.name || 'Untitled Ad',
    platform: ad.platform || 'Unknown',
    cpc: Number(ad.cpc || 0),
    ctr: Number(ad.ctr || 0),
    conversions: Number(ad.conversions || 0),
    status: evaluation.status,
    message: evaluation.message,
    recommendation: evaluation.recommendation,
    lastCheckedAt: new Date().toISOString()
  };
}

export function getMonitoringAlert(ad = {}) {
  const snapshot = buildMonitoringSnapshot(ad);
  if (snapshot.status === MonitoringStatus.HEALTHY) return null;

  return {
    title: snapshot.status === MonitoringStatus.UNDERPERFORMING ? 'Underperforming ad' : 'Monitoring warning',
    message: snapshot.message,
    recommendation: snapshot.recommendation,
    adId: snapshot.adId,
    level: snapshot.status === MonitoringStatus.UNDERPERFORMING ? 'critical' : 'warning'
  };
}