// xspresso_817_billing_credits_panel_v3.js
// Billing and credits helpers for Xspresso.

export const pricingPlans = {
  starter: { name: 'Starter', monthlyPrice: 29, creditsIncluded: 500 },
  pro: { name: 'Pro', monthlyPrice: 49, creditsIncluded: 1500 },
  business: { name: 'Business', monthlyPrice: 99, creditsIncluded: 4000 },
  agency: { name: 'Agency', monthlyPrice: 329, creditsIncluded: 10000 }
};

export function createSubscription(planName = 'starter') {
  const plan = pricingPlans[planName] || pricingPlans.starter;
  return {
    plan: planName,
    status: 'active',
    creditsIncluded: plan.creditsIncluded,
    creditsUsed: 0,
    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
}

export function getCreditSummary(subscription = {}) {
  const included = subscription.creditsIncluded || 0;
  const used = subscription.creditsUsed || 0;
  return {
    included,
    used,
    remaining: Math.max(included - used, 0)
  };
}
