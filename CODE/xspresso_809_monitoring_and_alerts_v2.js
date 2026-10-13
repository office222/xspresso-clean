// Xspresso monitoring and alerts v2

export function scoreAdHealth(ad = {}) {
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const clicks = Number(ad.clicks || 0);
  const conversions = Number(ad.conversions || 0);

  if (conversions === 0 && clicks > 20) {
    return {
      level: 'critical',
      title: 'Underperforming ad',
      message: 'This ad is underperforming. Regenerate it before spending more credits.'
    };
  }

  if (cpc > 1.5) {
    return {
      level: 'warning',
      title: 'CPC is rising',
      message: 'This ad may need a tweak before you spend more credits.'
    };
  }

  if (ctr > 0 && ctr < 0.8) {
    return {
      level: 'warning',
      title: 'CTR is low',
      message: 'Try a new hook, title, or angle.'
    };
  }

  return {
    level: 'info',
    title: 'Healthy',
    message: 'This ad is performing acceptably.'
  };
}

export function buildMonitoringAlert(ad = {}) {
  const health = scoreAdHealth(ad);
  return {
    id: `alert_${Date.now()}`,
    adId: ad.id || null,
    ...health,
    createdAt: new Date().toISOString(),
    action: health.level === 'critical' ? 'Regenerate this ad' : 'Keep monitoring'
  };
}
