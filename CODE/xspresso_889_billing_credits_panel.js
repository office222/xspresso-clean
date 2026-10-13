export function getCreditSummary(subscription = {}, usage = {}) {
  const included = Number(subscription.creditsIncluded || 0);
  const used = Number(usage.creditsUsed || 0);
  const remaining = Math.max(included - used, 0);
  return {
    plan: subscription.plan || 'starter',
    billingCycle: subscription.billingCycle || 'monthly',
    creditsIncluded: included,
    creditsUsed: used,
    creditsRemaining: remaining,
    renewalDate: subscription.renewsAt || null,
  };
}

export function calculateUsageWarning(summary) {
  const included = Number(summary.creditsIncluded || 0);
  const remaining = Number(summary.creditsRemaining || 0);
  if (included <= 0) {
    return { warning: false, message: 'No credits configured.' };
  }
  const threshold = Math.max(Math.floor(included * 0.2), 1);
  return remaining <= threshold
    ? { warning: true, message: `You have ${remaining} credits left this cycle.` }
    : { warning: false, message: 'Credits are within normal range.' };
}

export function suggestUpgrade(summary, plans = []) {
  const currentPlanName = summary.plan || 'starter';
  const currentPlanIndex = plans.findIndex((p) => p.name === currentPlanName || p.id === currentPlanName);
  if (currentPlanIndex < 0 || currentPlanIndex >= plans.length - 1) {
    return { shouldSuggest: false, message: 'No higher plan to suggest.' };
  }
  const nextPlan = plans[currentPlanIndex + 1];
  return {
    shouldSuggest: true,
    message: `Based on your usage, upgrading to ${nextPlan.name || nextPlan.id} may save you money.`,
    nextPlan,
  };
}

export function getPlanCard(plan) {
  return {
    id: plan.id || plan.name,
    name: plan.name,
    priceMonthly: plan.monthlyPrice,
    priceYearly: plan.yearlyPrice,
    creditsIncluded: plan.creditsIncluded,
    monitoredAds: plan.monitoredAds,
    socialPlatforms: plan.socialPlatforms,
  };
}

export function buildBillingCopy(summary) {
  return {
    headline: 'All plans include every tool.',
    subheadline: 'Credits simply determine fair usage.',
    statusLine: `You have ${summary.creditsRemaining} credits remaining.`,
    renewalLine: summary.renewalDate ? `Your plan renews on ${summary.renewalDate}.` : 'No renewal date set.',
  };
}
