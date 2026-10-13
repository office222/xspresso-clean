// xspresso_765_billing_credits_panel_v11.js
// Billing and credits helpers

export function buildBillingState(subscription = {}) {
  const creditsIncluded = Number(subscription.creditsIncluded || 0);
  const creditsUsed = Number(subscription.creditsUsed || 0);
  return {
    plan: subscription.plan || 'starter',
    billingCycle: subscription.billingCycle || 'monthly',
    creditsIncluded,
    creditsUsed,
    creditsRemaining: Math.max(creditsIncluded - creditsUsed, 0),
    renewsAt: subscription.renewsAt || '',
    status: subscription.status || 'active',
  };
}

export function addCredits(billingState, amount) {
  const creditsUsed = billingState.creditsUsed || 0;
  const creditsIncluded = billingState.creditsIncluded || 0;
  const nextUsed = creditsUsed + Number(amount || 0);
  return {
    ...billingState,
    creditsUsed: nextUsed,
    creditsRemaining: Math.max(creditsIncluded - nextUsed, 0),
  };
}

export function shouldSuggestUpgrade(billingState) {
  const threshold = (billingState.creditsIncluded || 0) * 0.8;
  return (billingState.creditsUsed || 0) >= threshold;
}

export function buildBillingSummary(billingState) {
  return {
    plan: billingState.plan,
    creditsRemaining: billingState.creditsRemaining,
    creditsUsed: billingState.creditsUsed,
    renewsAt: billingState.renewsAt,
    upgradeSuggested: shouldSuggestUpgrade(billingState),
  };
}
