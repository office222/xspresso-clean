// xspresso_740_monitoring_dashboard_v2.js
// Monitoring dashboard and alert helpers

export function scoreAdHealth(ad = {}) {
  const clicks = ad.clicks || 0;
  const conversions = ad.conversions || 0;
  const cpc = ad.cpc || 0;
  const ctr = ad.ctr || 0;

  if (clicks > 20 && conversions === 0) {
    return {
      status: 'underperforming',
      message: 'This ad is underperforming.',
      recommendation: 'Regenerate this ad with a new title, hook, or angle.'
    };
  }

  if (cpc >= 2 || ctr <= 0.5) {
    return {
      status: 'warning',
      message: 'This ad may need a tweak.',
      recommendation: 'Try a stronger headline or a different angle.'
    };
  }

  return {
    status: 'healthy',
    message: 'This ad is performing normally.',
    recommendation: 'Keep monitoring.'
  };
}

export function buildAlertFromAd(ad) {
  const health = scoreAdHealth(ad);
  return {
    id: `alert_${Date.now()}`,
    campaignId: ad.campaignId || null,
    adId: ad.id || null,
    level: health.status === 'healthy' ? 'info' : health.status,
    title: health.message,
    message: health.recommendation,
    createdAt: new Date().toISOString(),
    status: 'open'
  };
}

export function renderMonitoringRow(ad) {
  const health = scoreAdHealth(ad);
  return `
    <tr class="${health.status}">
      <td>${ad.name || 'Untitled Ad'}</td>
      <td>${ad.platform || 'Platform'}</td>
      <td>${ad.cpc ?? '—'}</td>
      <td>${ad.ctr ?? '—'}</td>
      <td>${ad.conversions ?? 0}</td>
      <td>${health.message}</td>
      <td>${health.recommendation}</td>
    </tr>
  `;
}
