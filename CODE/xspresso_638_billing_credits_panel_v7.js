// xspresso_638_billing_credits_panel_v7.js
// Billing and credits helpers for Xspresso

export const plans = {
  starter: { name: 'Starter', monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500 },
  pro: { name: 'Pro', monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500 },
  business: { name: 'Business', monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000 },
  agency: { name: 'Agency', monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000 }
};

export function buildBillingSummary(subscription = {}) {
  const plan = plans[subscription.plan] || plans.starter;
  const creditsUsed = Number(subscription.creditsUsed || 0);
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

export function suggestUpgrade(summary) {
  const remaining = Number(summary.creditsRemaining || 0);
  const included = Number(summary.creditsIncluded || 1);
  if (remaining <= included * 0.2) {
    return 'Based on your current use, the next tier may save you money.';
  }
  return 'You are within your current plan usage.';
}
