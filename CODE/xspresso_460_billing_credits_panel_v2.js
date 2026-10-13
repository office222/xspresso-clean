/* Xspresso v2 - billing and credits panel */

export const pricingPlans = {
  starter: { name: "Starter", monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500, monitoredAds: 12, socialPlatforms: 2 },
  pro: { name: "Pro", monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500, monitoredAds: 60, socialPlatforms: 5 },
  business: { name: "Business", monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000, monitoredAds: 150, socialPlatforms: 8 },
  agency: { name: "Agency", monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000, monitoredAds: 500, socialPlatforms: 12 }
};

export function buildCreditSummary(creditsIncluded, creditsUsed) {
  return {
    creditsIncluded,
    creditsUsed,
    creditsRemaining: Math.max(creditsIncluded - creditsUsed, 0)
  };
}

export function checkCreditWarning(subscription = {}) {
  const creditsIncluded = subscription.creditsIncluded || 0;
  const creditsUsed = subscription.creditsUsed || 0;
  const remaining = Math.max(creditsIncluded - creditsUsed, 0);
  const threshold = creditsIncluded * 0.2;

  if (remaining <= threshold) {
    return {
      warning: true,
      message: `You have ${remaining} credits left this cycle.`
    };
  }

  return {
    warning: false,
    message: "You are within your current credit usage."
  };
}

export function suggestPlanUpgrade(subscription = {}) {
  const plan = pricingPlans[subscription.plan] || pricingPlans.starter;
  const creditsUsed = subscription.creditsUsed || 0;

  if (creditsUsed > plan.creditsIncluded * 0.8) {
    return {
      shouldSuggest: true,
      message: "Based on your current usage, upgrading may save you money."
    };
  }

  return {
    shouldSuggest: false,
    message: "You are within your current plan."
  };
}

export function getBillingStatus(subscription = {}) {
  switch (subscription.status) {
    case "active": return "Your subscription is active.";
    case "past_due": return "Payment is past due.";
    case "paused": return "Your subscription is paused.";
    case "canceled": return "Your subscription is canceled.";
    default: return "Subscription status unknown.";
  }
}
