// xspresso_545_credits_billing_panel.js
// Credits and billing helpers for Xspresso

export const pricingPlans = {
  starter: { name: 'Starter', monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500, monitoredAds: 12, socialPlatforms: 2 },
  pro: { name: 'Pro', monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500, monitoredAds: 60, socialPlatforms: 5 },
  business: { name: 'Business', monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000, monitoredAds: 150, socialPlatforms: 8 },
  agency: { name: 'Agency', monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000, monitoredAds: 500, socialPlatforms: 12 },
};

export function createSubscription(userId, planName, billingCycle = 'monthly') {
  const plan = pricingPlans[planName];
  if (!plan) return { success: false, message: 'Invalid plan selected.' };
  return {
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

export function getRenewalDate(billingCycle) {
  const now = new Date();
  if (billingCycle === 'yearly') now.setFullYear(now.getFullYear() + 1);
  else now.setMonth(now.getMonth() + 1);
  return now.toISOString();
}

export function updateSubscriptionUsage(subscription, creditsUsed) {
  return { ...subscription, creditsUsed: (subscription.creditsUsed || 0) + creditsUsed };
}

export function buildCreditSummary(subscription) {
  const remaining = (subscription.creditsIncluded || 0) - (subscription.creditsUsed || 0);
  return { creditsIncluded: subscription.creditsIncluded || 0, creditsUsed: subscription.creditsUsed || 0, creditsRemaining: remaining };
}

export function suggestPlanUpgrade(subscription) {
  const plan = pricingPlans[subscription.plan];
  if (!plan) return { shouldSuggest: false, message: 'Unknown plan.' };
  const used = subscription.creditsUsed || 0;
  if (used > plan.creditsIncluded * 0.8) {
    return { shouldSuggest: true, message: 'Based on your current usage, the next tier may save you money.' };
  }
  return { shouldSuggest: false, message: 'You are within your current plan.' };
}
