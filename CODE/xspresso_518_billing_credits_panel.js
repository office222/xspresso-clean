export const Plans = {
  starter: { name: 'Starter', monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500 },
  pro: { name: 'Pro', monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500 },
  business: { name: 'Business', monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000 },
  agency: { name: 'Agency', monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000 }
};

export function getPlan(planKey = 'starter') {
  return Plans[planKey] || Plans.starter;
}

export function buildBillingSummary(subscription = {}) {
  const plan = getPlan(subscription.plan);
  const creditsUsed = subscription.creditsUsed || 0;
  const creditsRemaining = plan.creditsIncluded - creditsUsed;
  return {
    plan: subscription.plan || 'starter',
    billingCycle: subscription.billingCycle || 'monthly',
    creditsIncluded: plan.creditsIncluded,
    creditsUsed,
    creditsRemaining,
    renewsAt: subscription.renewsAt || null,
    status: subscription.status || 'active'
  };
}

export function suggestUpgrade(summary = {}) {
  const threshold = Math.floor((summary.creditsIncluded || 0) * 0.2);
  if ((summary.creditsRemaining || 0) <= threshold) {
    return {
      shouldSuggest: true,
      message: 'Based on your usage, the next tier may save you money.'
    };
  }
  return { shouldSuggest: false, message: 'You are within your current plan usage.' };
}

export function useCredits(summary = {}, amount = 0) {
  const creditsUsed = (summary.creditsUsed || 0) + amount;
  return { ...summary, creditsUsed, creditsRemaining: (summary.creditsIncluded || 0) - creditsUsed };
}
