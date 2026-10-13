export const PricingPlans = {
  starter: { name: 'Starter', monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500, monitoredAds: 12 },
  pro: { name: 'Pro', monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500, monitoredAds: 60 },
  business: { name: 'Business', monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000, monitoredAds: 150 },
  agency: { name: 'Agency', monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000, monitoredAds: 500 }
};

export function calculateCreditsRemaining(subscription) {
  return Math.max((subscription.creditsIncluded || 0) - (subscription.creditsUsed || 0), 0);
}

export function suggestUpgrade(subscription) {
  const remaining = calculateCreditsRemaining(subscription);
  const threshold = Math.floor((subscription.creditsIncluded || 0) * 0.2);

  return {
    shouldSuggest: remaining <= threshold,
    message: remaining <= threshold ? 'Based on your usage, the next tier may save you money.' : 'You are within your current plan.'
  };
}

export function addCreditUsage(subscription, creditsUsed = 0) {
  return {
    ...subscription,
    creditsUsed: (subscription.creditsUsed || 0) + creditsUsed
  };
}
