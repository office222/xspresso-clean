// Xspresso V1 - Billing and Subscription Engine
// Purpose: manage plans, credits, renewals, upgrades, and subscription state.

const pricingPlans = {
  starter: {
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 24,
    creditsIncluded: 500,
    monitoredAds: 12,
    socialPlatforms: 2
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 49,
    yearlyPrice: 40,
    creditsIncluded: 1500,
    monitoredAds: 60,
    socialPlatforms: 5
  },
  business: {
    name: 'Business',
    monthlyPrice: 99,
    yearlyPrice: 79,
    creditsIncluded: 4000,
    monitoredAds: 150,
    socialPlatforms: 8
  },
  agency: {
    name: 'Agency',
    monthlyPrice: 329,
    yearlyPrice: 279,
    creditsIncluded: 10000,
    monitoredAds: 500,
    socialPlatforms: 12
  }
};

function getPlan(planName) {
  return pricingPlans[planName] || null;
}

function getRenewalDate(billingCycle) {
  const now = new Date();

  if (billingCycle === 'yearly') {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }

  return now.toISOString();
}

function createSubscription(userId, planName, billingCycle = 'monthly') {
  const plan = getPlan(planName);

  if (!plan) {
    return {
      success: false,
      message: 'Invalid plan selected.'
    };
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
    autoRenew: true,
    planLimits: {
      monitoredAds: plan.monitoredAds,
      socialPlatforms: plan.socialPlatforms
    }
  };
}

function updateSubscriptionUsage(subscription, creditsUsed) {
  return {
    ...subscription,
    creditsUsed: (subscription.creditsUsed || 0) + creditsUsed
  };
}

function getRemainingCredits(subscription) {
  return Math.max((subscription.creditsIncluded || 0) - (subscription.creditsUsed || 0), 0);
}

function checkCreditWarning(subscription) {
  const remaining = getRemainingCredits(subscription);
  const threshold = Math.floor((subscription.creditsIncluded || 0) * 0.2);

  if (remaining <= threshold) {
    return {
      warning: true,
      message: `You have ${remaining} credits left this cycle.`
    };
  }

  return {
    warning: false,
    message: 'You are within your current credit usage.'
  };
}

function suggestPlanUpgrade(subscription, usageLog = []) {
  const currentPlan = getPlan(subscription.plan);
  const totalUsed = usageLog.reduce((sum, item) => sum + (item.creditsUsed || 0), 0);

  if (currentPlan && totalUsed > currentPlan.creditsIncluded * 0.8) {
    return {
      shouldSuggest: true,
      message: 'Based on your usage, the next tier may save you money.'
    };
  }

  return {
    shouldSuggest: false,
    message: 'You are within your current plan.'
  };
}

function buildRenewalReminder(subscription) {
  return {
    userId: subscription.userId,
    subscriptionId: subscription.id || 'sub_unknown',
    reminderType: 'renewal',
    message: `Your ${subscription.plan} plan will renew soon.`,
    sentAt: new Date().toISOString()
  };
}

function getBillingStatus(subscription) {
  switch (subscription.status) {
    case 'active':
      return 'Your subscription is active.';
    case 'past_due':
      return 'Payment is past due.';
    case 'paused':
      return 'Your subscription is paused.';
    case 'canceled':
      return 'Your subscription is canceled.';
    default:
      return 'Subscription status unknown.';
  }
}

function pauseSubscription(subscription) {
  return {
    ...subscription,
    status: 'paused',
    pausedAt: new Date().toISOString()
  };
}

function cancelSubscription(subscription) {
  return {
    ...subscription,
    status: 'canceled',
    canceledAt: new Date().toISOString(),
    autoRenew: false
  };
}

function reactivateSubscription(subscription) {
  return {
    ...subscription,
    status: 'active',
    reactivatedAt: new Date().toISOString(),
    autoRenew: true
  };
}

function calculateMonitoringCharge(platformCount, ratePerDay) {
  return platformCount * ratePerDay;
}

function shouldSuggestUpgrade(subscription, usageLog = []) {
  const currentPlan = getPlan(subscription.plan);
  const totalUsed = usageLog.reduce((sum, item) => sum + (item.creditsUsed || 0), 0);

  if (!currentPlan) return false;
  return totalUsed > currentPlan.creditsIncluded * 0.8;
}

module.exports = {
  pricingPlans,
  getPlan,
  getRenewalDate,
  createSubscription,
  updateSubscriptionUsage,
  getRemainingCredits,
  checkCreditWarning,
  suggestPlanUpgrade,
  buildRenewalReminder,
  getBillingStatus,
  pauseSubscription,
  cancelSubscription,
  reactivateSubscription,
  calculateMonitoringCharge,
  shouldSuggestUpgrade
};
