// Xspresso billing / credits panel v10

export const pricingPlans = {
  starter: { name: 'Starter', monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500 },
  pro: { name: 'Pro', monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500 },
  business: { name: 'Business', monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000 },
  agency: { name: 'Agency', monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000 },
};

export function createSubscription(userId, planName = 'starter', billingCycle = 'monthly') {
  const plan = pricingPlans[planName];
  if (!plan) return { success: false, message: 'Invalid plan selected.' };

  return {
    success: true,
    userId,
    plan: planName,
    billingCycle,
    status: 'active',
    startedAt: new Date().toISOString(),
    renewsAt: getRenewalDate(billingCycle),
    creditsIncluded: plan.creditsIncluded,
    creditsUsed: 0,
    autoRenew: true,
  };
}

export function getRenewalDate(billingCycle = 'monthly') {
  const now = new Date();
  if (billingCycle === 'yearly') now.setFullYear(now.getFullYear() + 1);
  else now.setMonth(now.getMonth() + 1);
  return now.toISOString();
}

export function summarizeCredits(subscription = {}, usageLog = []) {
  const used = usageLog.reduce((sum, entry) => sum + (entry.creditsUsed || 0), 0);
  const included = subscription.creditsIncluded || 0;
  const remaining = included - used;
  return { included, used, remaining, low: remaining <= included * 0.2 };
}

export function suggestUpgrade(subscription = {}, usageLog = []) {
  const currentPlan = pricingPlans[subscription.plan];
  if (!currentPlan) return { shouldSuggest: false, message: 'Plan not found.' };
  const { used } = summarizeCredits(subscription, usageLog);
  return used > currentPlan.creditsIncluded * 0.8
    ? { shouldSuggest: true, message: 'Based on your usage, the next tier may save you money.' }
    : { shouldSuggest: false, message: 'You are within your current plan.' };
}

export function logCreditEvent(type, creditsUsed, note = '') {
  return {
    id: `cred_${Date.now()}`,
    type,
    creditsUsed,
    note,
    createdAt: new Date().toISOString(),
  };
}
