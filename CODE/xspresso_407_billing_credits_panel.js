// xspresso_407_billing_credits_panel.js
// Billing and credits panel logic for Xspresso.

export const billingPlans = {
  starter: {
    name: 'Starter',
    billingCycle: 'monthly',
    priceMonthly: 29,
    priceYearly: 24,
    creditsIncluded: 500,
    monitoredAds: 12,
    socialPlatforms: 2,
  },
  pro: {
    name: 'Pro',
    billingCycle: 'monthly',
    priceMonthly: 49,
    priceYearly: 40,
    creditsIncluded: 1500,
    monitoredAds: 60,
    socialPlatforms: 5,
  },
  business: {
    name: 'Business',
    billingCycle: 'monthly',
    priceMonthly: 99,
    priceYearly: 79,
    creditsIncluded: 4000,
    monitoredAds: 150,
    socialPlatforms: 8,
  },
  agency: {
    name: 'Agency',
    billingCycle: 'monthly',
    priceMonthly: 329,
    priceYearly: 279,
    creditsIncluded: 10000,
    monitoredAds: 500,
    socialPlatforms: 12,
  },
};

export const aLaCarteCreditCosts = {
  extraLandingPage: 125,
  extraUpload: 100,
  extraVariation: 25,
  extraFollowUpSequence: 50,
  rushSwitch: 20,
};

export function getPlanSummary(planKey) {
  const plan = billingPlans[planKey];
  if (!plan) return null;

  return {
    ...plan,
    summary: `${plan.name} includes ${plan.creditsIncluded} credits and monitoring for ${plan.monitoredAds} ads.`,
  };
}

export function calculateRemainingCredits(creditsIncluded, creditsUsed) {
  return Math.max(creditsIncluded - creditsUsed, 0);
}

export function suggestUpgrade(planKey, creditsUsed) {
  const plan = billingPlans[planKey];
  if (!plan) return null;

  const threshold = Math.floor(plan.creditsIncluded * 0.8);
  if (creditsUsed < threshold) {
    return {
      shouldSuggest: false,
      message: 'You are within your current plan usage.',
    };
  }

  return {
    shouldSuggest: true,
    message: 'Based on your usage, the next tier may save you money.',
  };
}

export function renderBillingPanel(state) {
  const plan = billingPlans[state.planKey] || billingPlans.starter;
  const remaining = calculateRemainingCredits(plan.creditsIncluded, state.creditsUsed || 0);

  return `
    <section class="panel billing-panel">
      <h2>Credits & Billing</h2>
      <div class="billing-summary">
        <p><strong>Plan:</strong> ${plan.name}</p>
        <p><strong>Billing cycle:</strong> ${state.billingCycle || 'monthly'}</p>
        <p><strong>Credits included:</strong> ${plan.creditsIncluded}</p>
        <p><strong>Credits used:</strong> ${state.creditsUsed || 0}</p>
        <p><strong>Credits remaining:</strong> ${remaining}</p>
        <p><strong>Next renewal:</strong> ${state.renewsAt || 'TBD'}</p>
      </div>
      <div class="billing-actions">
        <button type="button">Add Credits</button>
        <button type="button">Upgrade Plan</button>
        <button type="button">View Usage Log</button>
      </div>
      <p class="billing-note">All plans include every tool. Credits simply determine fair usage.</p>
    </section>
  `;
}
