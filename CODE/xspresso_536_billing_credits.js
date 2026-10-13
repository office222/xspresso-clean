// Xspresso billing and credits helpers

export const Plans = {
  starter: { name: "Starter", monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500, monitoredAds: 12, socialPlatforms: 2 },
  pro: { name: "Pro", monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500, monitoredAds: 60, socialPlatforms: 5 },
  business: { name: "Business", monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000, monitoredAds: 150, socialPlatforms: 8 },
  agency: { name: "Agency", monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000, monitoredAds: 500, socialPlatforms: 12 },
};

export function createSubscription(userId, planName, billingCycle = "monthly") {
  const plan = Plans[planName];
  if (!plan) return { success: false, message: "Invalid plan selected." };
  return {
    userId,
    plan: planName,
    billingCycle,
    status: "active",
    startedAt: new Date().toISOString(),
    renewsAt: getRenewalDate(billingCycle),
    creditsIncluded: plan.creditsIncluded,
    creditsUsed: 0,
    autoRenew: true,
  };
}

export function getRenewalDate(billingCycle) {
  const now = new Date();
  if (billingCycle === "yearly") now.setFullYear(now.getFullYear() + 1);
  else now.setMonth(now.getMonth() + 1);
  return now.toISOString();
}

export function updateUsage(subscription, creditsUsed = 0) {
  return { ...subscription, creditsUsed: (subscription.creditsUsed || 0) + creditsUsed };
}

export function remainingCredits(subscription) {
  return Math.max(0, (subscription.creditsIncluded || 0) - (subscription.creditsUsed || 0));
}

export function shouldSuggestUpgrade(subscription) {
  const remaining = remainingCredits(subscription);
  const threshold = (subscription.creditsIncluded || 0) * 0.2;
  return remaining <= threshold;
}
