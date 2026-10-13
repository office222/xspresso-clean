// Xspresso - Billing / Credits Panel (v2)
// Purpose: Simple fair-usage billing and visible credit tracking.

export const PLAN_DEFINITIONS = {
  starter: { name: 'Starter', monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500 },
  pro: { name: 'Pro', monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500 },
  business: { name: 'Business', monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000 },
  agency: { name: 'Agency', monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000 },
};

export const CREDIT_COSTS = {
  campaignGeneration: 50,
  landingPage: 25,
  extraAdVariation: 10,
  monitoredAdDaily: 5,
  monitoredAdWeekly: 30,
  monitoredAdMonthly: 100,
  platformSwitch: 20,
  regenerateSection: 5,
};

export function createBillingState(planKey = 'starter', cycle = 'monthly') {
  const plan = PLAN_DEFINITIONS[planKey] || PLAN_DEFINITIONS.starter;
  return {
    planKey,
    cycle,
    plan,
    creditsIncluded: plan.creditsIncluded,
    creditsUsed: 0,
    autoRenew: true,
    renewsAt: nextRenewalDate(cycle),
    status: 'active',
  };
}

export function nextRenewalDate(cycle = 'monthly') {
  const d = new Date();
  if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export function addCreditUsage(billingState, usageKey, quantity = 1) {
  const cost = (CREDIT_COSTS[usageKey] || 0) * quantity;
  return {
    ...billingState,
    creditsUsed: billingState.creditsUsed + cost,
    lastUsage: { usageKey, quantity, cost, at: new Date().toISOString() },
  };
}

export function remainingCredits(billingState) {
  return Math.max((billingState.creditsIncluded || 0) - (billingState.creditsUsed || 0), 0);
}

export function usageWarning(billingState) {
  const remaining = remainingCredits(billingState);
  const threshold = Math.ceil((billingState.creditsIncluded || 0) * 0.2);
  return {
    low: remaining <= threshold,
    remaining,
    message: remaining <= threshold
      ? `You have ${remaining} credits remaining this cycle.`
      : 'You are within your current credit usage.',
  };
}

export function recommendUpgrade(billingState) {
  const remaining = remainingCredits(billingState);
  if (remaining <= Math.ceil((billingState.creditsIncluded || 0) * 0.1)) {
    return 'Based on your usage, the next tier may save you money.';
  }
  return null;
}
