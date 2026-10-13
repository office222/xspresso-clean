// xspresso_793_billing_credits_panel.js
// Billing / credits panel helpers for Xspresso

export const pricingPlans = {
  starter: { name: 'Starter', price: 29, creditsIncluded: 500, monitoredAds: 12 },
  pro: { name: 'Pro', price: 49, creditsIncluded: 1500, monitoredAds: 60 },
  business: { name: 'Business', price: 99, creditsIncluded: 4000, monitoredAds: 150 },
  agency: { name: 'Agency', price: 329, creditsIncluded: 10000, monitoredAds: 500 },
};

export function getPlan(planName = 'starter') {
  return pricingPlans[planName] || pricingPlans.starter;
}

export function createBillingSummary(subscription, activityLog = []) {
  const plan = getPlan(subscription?.plan);
  const creditsUsed = activityLog.reduce((sum, item) => sum + (item.creditsUsed || 0), 0);
  const creditsRemaining = Math.max((plan.creditsIncluded || 0) - creditsUsed, 0);

  return {
    planName: plan.name,
    price: plan.price,
    creditsIncluded: plan.creditsIncluded,
    creditsUsed,
    creditsRemaining,
    monitoredAds: plan.monitoredAds,
    renewsAt: subscription?.renewsAt || null,
    status: subscription?.status || 'active',
  };
}

export function shouldSuggestUpgrade(summary) {
  if (!summary || !summary.creditsIncluded) return false;
  return summary.creditsRemaining <= Math.ceil(summary.creditsIncluded * 0.2);
}

export function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function billingCopy(summary) {
  if (shouldSuggestUpgrade(summary)) {
    return {
      headline: 'You are getting close to your credit limit.',
      body: 'Based on your current usage, the next tier may save you money.',
      cta: 'See Plans',
    };
  }

  return {
    headline: 'All plans include every tool.',
    body: 'Credits simply determine fair usage.',
    cta: 'Add Credits',
  };
}
