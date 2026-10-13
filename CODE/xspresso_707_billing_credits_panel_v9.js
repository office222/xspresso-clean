// Xspresso Billing & Credits Panel v9
// Tracks plan status, credits usage, and upgrade suggestions.

export const pricingPlans = {
  starter: { name: 'Starter', creditsIncluded: 500, monitoredAds: 12 },
  pro: { name: 'Pro', creditsIncluded: 1500, monitoredAds: 60 },
  business: { name: 'Business', creditsIncluded: 4000, monitoredAds: 150 },
  agency: { name: 'Agency', creditsIncluded: 10000, monitoredAds: 500 }
};

export function buildBillingSnapshot(subscription = {}, usage = {}) {
  const plan = pricingPlans[subscription.plan] || pricingPlans.starter;
  const used = usage.creditsUsed || subscription.creditsUsed || 0;
  const remaining = Math.max((plan.creditsIncluded || 0) - used, 0);

  return {
    plan: subscription.plan || 'starter',
    planName: plan.name,
    billingCycle: subscription.billingCycle || 'monthly',
    status: subscription.status || 'active',
    creditsIncluded: plan.creditsIncluded,
    creditsUsed: used,
    creditsRemaining: remaining,
    monitoredAds: plan.monitoredAds,
    renewsAt: subscription.renewsAt || null
  };
}

export function creditWarning(snapshot) {
  const threshold = Math.floor((snapshot.creditsIncluded || 0) * 0.2);
  const remaining = snapshot.creditsRemaining || 0;
  if (remaining <= threshold) {
    return `You have ${remaining} credits left this cycle.`;
  }
  return 'You are within your current plan usage.';
}

export function suggestUpgrade(snapshot) {
  const usage = snapshot.creditsUsed || 0;
  if (usage > (snapshot.creditsIncluded || 0) * 0.8) {
    return 'Based on your usage, the next tier may save you money.';
  }
  return 'You are within your current plan.';
}

export function spendCredits(snapshot, amount = 0) {
  const creditsUsed = (snapshot.creditsUsed || 0) + amount;
  return {
    ...snapshot,
    creditsUsed,
    creditsRemaining: Math.max((snapshot.creditsIncluded || 0) - creditsUsed, 0)
  };
}
