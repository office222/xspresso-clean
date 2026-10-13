// xspresso_619_billing_credits_panel_v6.js
// Billing and credits helpers for Xspresso

export const Plans = {
  starter: { name: 'Starter', monthlyPrice: 29, creditsIncluded: 500 },
  pro: { name: 'Pro', monthlyPrice: 49, creditsIncluded: 1500 },
  business: { name: 'Business', monthlyPrice: 99, creditsIncluded: 4000 },
  agency: { name: 'Agency', monthlyPrice: 329, creditsIncluded: 10000 },
};

export function buildBillingSummary(subscription = {}) {
  const plan = Plans[subscription.plan] || Plans.starter;
  const used = subscription.creditsUsed || 0;
  const remaining = Math.max((subscription.creditsIncluded ?? plan.creditsIncluded) - used, 0);
  return {
    plan: subscription.plan || 'starter',
    billingCycle: subscription.billingCycle || 'monthly',
    creditsIncluded: subscription.creditsIncluded ?? plan.creditsIncluded,
    creditsUsed: used,
    creditsRemaining: remaining,
    renewsAt: subscription.renewsAt || null,
    autoRenew: subscription.autoRenew ?? true,
  };
}

export function shouldSuggestUpgrade(summary = {}) {
  const included = summary.creditsIncluded || 0;
  const remaining = summary.creditsRemaining || 0;
  return included > 0 && remaining <= included * 0.2;
}

export function getRenewalCopy(summary = {}) {
  return shouldSuggestUpgrade(summary)
    ? 'You are getting close to your credit limit. The next tier may save you money.'
    : 'Your usage is within your current plan.';
}
