// xspresso_877_billing_panel.js
// Billing and credits helpers for Xspresso.

export const PLANS = {
  starter: { monthly: 29, yearly: 24, credits: 500 },
  pro: { monthly: 49, yearly: 40, credits: 1500 },
  business: { monthly: 99, yearly: 79, credits: 4000 },
  agency: { monthly: 329, yearly: 279, credits: 10000 },
};

export function buildBillingSummary(subscription = {}) {
  const plan = PLANS[subscription.plan] || PLANS.starter;
  const used = Number(subscription.creditsUsed || 0);
  const included = Number(subscription.creditsIncluded || plan.credits);

  return {
    plan: subscription.plan || 'starter',
    billingCycle: subscription.billingCycle || 'monthly',
    included,
    used,
    remaining: Math.max(included - used, 0),
    renewsAt: subscription.renewsAt || null,
    canUpgrade: used > included * 0.8,
  };
}

export function shouldSuggestUpgrade(summary) {
  return summary.canUpgrade === true;
}
