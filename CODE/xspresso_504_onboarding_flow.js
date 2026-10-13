// xspresso_504_onboarding_flow.js
// Onboarding step helpers for the Xspresso app.

export const onboardingSteps = [
  'welcome',
  'what_to_create',
  'add_offer',
  'choose_goal',
  'choose_tone',
  'choose_platform',
  'generate_draft',
  'review_and_tweak',
  'launch',
  'monitor'
];

export function getDefaultOnboardingState() {
  return {
    step: 'welcome',
    productName: '',
    productUrl: '',
    productImage: '',
    offerDescription: '',
    goal: 'sales',
    tone: 'simple',
    platform: 'general',
    startedAt: new Date().toISOString()
  };
}

export function advanceOnboarding(state) {
  const currentIndex = onboardingSteps.indexOf(state.step);
  const nextStep = onboardingSteps[Math.min(currentIndex + 1, onboardingSteps.length - 1)];
  return {
    ...state,
    step: nextStep,
    updatedAt: new Date().toISOString()
  };
}

export function updateOnboardingField(state, key, value) {
  return {
    ...state,
    [key]: value,
    updatedAt: new Date().toISOString()
  };
}

export function buildOnboardingSummary(state) {
  return {
    step: state.step,
    offerReady: Boolean(state.productName || state.offerDescription),
    goal: state.goal,
    tone: state.tone,
    platform: state.platform
  };
}
