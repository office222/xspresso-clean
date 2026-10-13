// xspresso_690_billing_credits_panel_v8.js
// Billing / credits helpers for Xspresso.

export const PLANS = {
  starter: { name: "Starter", monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500 },
  pro: { name: "Pro", monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500 },
  business: { name: "Business", monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000 },
  agency: { name: "Agency", monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000 }
};

export function createSubscription(userId, planName, billingCycle = "monthly") {
  const plan = PLANS[planName];
  if (!plan) {
    return { success: false, message: "Invalid plan selected." };
  }

  const now = new Date();
  const renewsAt = new Date(now);
  if (billingCycle === "yearly") renewsAt.setFullYear(now.getFullYear() + 1);
  else renewsAt.setMonth(now.getMonth() + 1);

  return {
    userId,
    plan: planName,
    billingCycle,
    status: "active",
    startedAt: now.toISOString(),
    renewsAt: renewsAt.toISOString(),
    creditsIncluded: plan.creditsIncluded,
    creditsUsed: 0,
    autoRenew: true
  };
}

export function updateSubscriptionUsage(subscription, creditsUsed = 0) {
  return {
    ...subscription,
    creditsUsed: (subscription.creditsUsed || 0) + creditsUsed
  };
}

export function buildCreditSummary(subscription = {}) {
  const remaining = (subscription.creditsIncluded || 0) - (subscription.creditsUsed || 0);
  const threshold = (subscription.creditsIncluded || 0) * 0.2;
  return {
    creditsIncluded: subscription.creditsIncluded || 0,
    creditsUsed: subscription.creditsUsed || 0,
    creditsRemaining: remaining,
    warning: remaining <= threshold,
    shouldSuggestUpgrade: remaining <= threshold
  };
}

export function suggestPlanUpgrade(subscription = {}) {
  const current = PLANS[subscription.plan];
  if (!current) return { shouldSuggest: false, message: "" };
  const used = subscription.creditsUsed || 0;

  if (used > current.creditsIncluded * 0.8) {
    return { shouldSuggest: true, message: "Based on your usage, the next tier may save you money." };
  }
  return { shouldSuggest: false, message: "You are within your current plan." };
}
