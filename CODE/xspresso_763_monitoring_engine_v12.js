// xspresso_763_monitoring_engine_v12.js
// Monitoring and alert helpers

export function evaluateMonitoringState(metrics = {}) {
  const alerts = [];
  const cpc = Number(metrics.cpc || 0);
  const ctr = Number(metrics.ctr || 0);
  const conversions = Number(metrics.conversions || 0);
  const clicks = Number(metrics.clicks || 0);

  if (cpc > 1.5) {
    alerts.push({
      level: 'warning',
      title: 'CPC is rising',
      message: 'This campaign may need a tweak before more credits are spent.',
      suggestion: 'Try a new title or hook.',
    });
  }

  if (ctr > 0 && ctr < 0.8) {
    alerts.push({
      level: 'warning',
      title: 'CTR is low',
      message: 'Try a different angle or stronger headline.',
      suggestion: 'Regenerate the headline or hook.',
    });
  }

  if (clicks > 20 && conversions === 0) {
    alerts.push({
      level: 'critical',
      title: 'Underperforming ad',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      suggestion: 'Regenerate this ad with a new title, hook, or angle.',
    });
  }

  return {
    status: alerts.some(a => a.level === 'critical') ? 'needs_attention' : alerts.length ? 'watching' : 'healthy',
    alerts,
    summary: alerts.length ? `${alerts.length} alert(s)` : 'No issues detected',
  };
}

export function buildMonitoringCard(metrics = {}) {
  const state = evaluateMonitoringState(metrics);
  return {
    cpc: metrics.cpc || 0,
    ctr: metrics.ctr || 0,
    clicks: metrics.clicks || 0,
    conversions: metrics.conversions || 0,
    ...state,
  };
}
