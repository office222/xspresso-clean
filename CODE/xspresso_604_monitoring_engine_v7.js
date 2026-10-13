export function evaluateAdHealth(ad = {}) {
  const cpc = ad.cpc ?? 0;
  const ctr = ad.ctr ?? 0;
  const clicks = ad.clicks ?? 0;
  const conversions = ad.conversions ?? 0;

  const underperforming = conversions === 0 && clicks >= 20;
  const cpcWarning = cpc >= 1.5;
  const ctrWarning = ctr > 0 && ctr < 0.8;

  if (underperforming) {
    return {
      status: 'underperforming',
      message: 'This ad is underperforming.',
      recommendation: 'Improve it before spending more credits monitoring an ad that is not performing.',
      actions: ['Regenerate this ad', 'Rewrite the title', 'Test a new hook', 'Try a different angle']
    };
  }

  if (cpcWarning || ctrWarning) {
    return {
      status: 'warning',
      message: 'This ad may need a tweak.',
      recommendation: 'Try a new title, hook, or CTA before spending more credits.',
      actions: ['Tweak the title', 'Tweak the hook', 'Update the CTA']
    };
  }

  return {
    status: 'healthy',
    message: 'This ad is performing well.',
    recommendation: 'Keep monitoring.',
    actions: ['Keep monitoring']
  };
}
