// xspresso_668_billing_panel.js
// Billing, credits, and renewal helpers for Xspresso

const plans = {
  starter: { name: 'Starter', monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500 },
  pro: { name: 'Pro', monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500 },
  business: { name: 'Business', monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000 },
  agency: { name: 'Agency', monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000 }
};

function createSubscription(userId, planName, billingCycle = 'monthly') {
  const plan = plans[planName];
  if (!plan) {
    return { success: false, message: 'Invalid plan selected.' };
  }

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
    creditsRemaining: plan.creditsIncluded,
    autoRenew: true
  };
}

function getRenewalDate(billingCycle) {
  const now = new Date();
  if (billingCycle === 'yearly') now.setFullYear(now.getFullYear() + 1);
  else now.setMonth(now.getMonth() + 1);
  return now.toISOString();
}

function updateUsage(subscription, creditsUsed = 0) {
  const used = (subscription.creditsUsed || 0) + creditsUsed;
  const remaining = Math.max((subscription.creditsIncluded || 0) - used, 0);
  return {
    ...subscription,
    creditsUsed: used,
    creditsRemaining: remaining
  };
}

function shouldSuggestUpgrade(subscription) {
  const remaining = subscription.creditsRemaining ?? 0;
  const included = subscription.creditsIncluded ?? 0;
  if (included === 0) return false;
  return remaining <= included * 0.2;
}

function buildBillingSummary(subscription) {
  return {
    plan: subscription.plan,
    billingCycle: subscription.billingCycle,
    creditsIncluded: subscription.creditsIncluded,
    creditsUsed: subscription.creditsUsed,
    creditsRemaining: subscription.creditsRemaining,
    renewsAt: subscription.renewsAt,
    suggestUpgrade: shouldSuggestUpgrade(subscription)
  };
}

module.exports = {
  plans,
  createSubscription,
  getRenewalDate,
  updateUsage,
  shouldSuggestUpgrade,
  buildBillingSummary
};