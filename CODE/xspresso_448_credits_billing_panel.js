// xspresso_448_credits_billing_panel.js
// Credits, billing, and renewal helpers for Xspresso

export const pricingPlans = {
  starter: { name: "Starter", monthlyPrice: 29, yearlyPrice: 24, creditsIncluded: 500, monitoredAds: 12, socialPlatforms: 2 },
  pro: { name: "Pro", monthlyPrice: 49, yearlyPrice: 40, creditsIncluded: 1500, monitoredAds: 60, socialPlatforms: 5 },
  business: { name: "Business", monthlyPrice: 99, yearlyPrice: 79, creditsIncluded: 4000, monitoredAds: 150, socialPlatforms: 8 },
  agency: { name: "Agency", monthlyPrice: 329, yearlyPrice: 279, creditsIncluded: 10000, monitoredAds: 500, socialPlatforms: 12 }
};

export function buildCreditsPanel(subscription = {}, usage = []) {
  const plan = pricingPlans[subscription.plan] || pricingPlans.starter;
  const used = usage.reduce((sum, item) => sum + Number(item.creditsUsed || 0), 0);
  const remaining = Math.max(plan.creditsIncluded - used, 0);

  return {
    plan: plan.name,
    billingCycle: subscription.billingCycle || "monthly",
    creditsIncluded: plan.creditsIncluded,
    creditsUsed: used,
    creditsRemaining: remaining,
    renewsAt: subscription.renewsAt || null,
    actions: ["view_usage", "buy_credits", "upgrade_plan", "pause_subscription"]
  };
}

export function calculateMonitoringCost({ term = "daily", rate = 5, adCount = 1 } = {}) {
  const multiplier = term === "weekly" ? 7 : term === "monthly" ? 30 : 1;
  return adCount * rate * multiplier;
}

export function shouldSuggestUpgrade(subscription = {}, usage = []) {
  const plan = pricingPlans[subscription.plan] || pricingPlans.starter;
  const used = usage.reduce((sum, item) => sum + Number(item.creditsUsed || 0), 0);
  return used >= plan.creditsIncluded * 0.8;
}

export function buildBillingStatus(subscription = {}) {
  return {
    plan: subscription.plan || "starter",
    status: subscription.status || "active",
    autoRenew: subscription.autoRenew !== false,
    renewsAt: subscription.renewsAt || null,
    message:
      subscription.status === "past_due"
        ? "Payment is past due."
        : subscription.status === "paused"
        ? "Your subscription is paused."
        : "Your subscription is active."
  };
}
