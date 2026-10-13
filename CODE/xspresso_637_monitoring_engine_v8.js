// xspresso_637_monitoring_engine_v8.js
// Monitoring and ad health evaluation for Xspresso

export function evaluateAdHealth(ad = {}) {
  const cpc = Number(ad.cpc || 0);
  const ctr = Number(ad.ctr || 0);
  const conversions = Number(ad.conversions || 0);
  const clicks = Number(ad.clicks || 0);

  const poorCTR = ctr < 0.8;
  const highCPC = cpc > 1.5;
  const noConversions = conversions === 0 && clicks > 20;

  if (noConversions || highCPC || poorCTR) {
    return {
      status: 'underperforming',
      message: 'This ad is underperforming.',
      recommendation: 'Improve it before spending more credits monitoring an ad that is not performing.',
      actions: ['Regenerate this ad', 'Rewrite the title', 'Test a new hook', 'Try a different angle', 'Change the CTA']
    };
  }

  return {
    status: 'healthy',
    message: 'This ad is performing acceptably.',
    recommendation: 'Keep monitoring.',
    actions: ['Keep watching', 'Review later']
  };
}

export function buildAlert(ad = {}) {
  const health = evaluateAdHealth(ad);
  return {
    adId: ad.id || null,
    title: ad.name || 'Untitled Ad',
    ...health,
    createdAt: new Date().toISOString()
  };
}
