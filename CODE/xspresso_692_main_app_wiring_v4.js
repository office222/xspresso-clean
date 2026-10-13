// xspresso_692_main_app_wiring_v4.js
// Main app wiring for Xspresso.

import { buildCampaignBrief, validateCampaignBrief, getSmartDefaults } from "./xspresso_687_campaign_builder_form_v6.js";
import { createDraftState, approveSection, regenerateSection } from "./xspresso_688_campaign_review_panel_v10.js";
import { checkLaunchReadiness, launchCampaign, postLaunchState } from "./xspresso_689_launch_flow_v8.js";
import { buildCreditSummary, updateSubscriptionUsage } from "./xspresso_690_billing_credits_panel_v8.js";
import { buildPlatformSwitchWarning } from "./xspresso_691_platform_switch_modal_v8.js";

export function createAppState() {
  return {
    user: { name: "", plan: "starter", creditsRemaining: 0 },
    brief: buildCampaignBrief(),
    campaign: createDraftState(),
    subscription: null,
    alerts: [],
    notifications: [],
    currentView: "dashboard"
  };
}

export function initializeCampaignFromInput(input = {}) {
  const brief = getSmartDefaults(input);
  const validation = validateCampaignBrief(brief);
  const campaign = createDraftState({
    headline: "Wake up your marketing.",
    subheadline: "More responses. Less software chaos."
  });

  return { brief, validation, campaign };
}

export function handleApproveSection(state, sectionName) {
  return {
    ...state,
    campaign: approveSection(state.campaign, sectionName)
  };
}

export function handleRegenerateSection(state, sectionName) {
  return {
    ...state,
    campaign: regenerateSection(state.campaign, sectionName)
  };
}

export function handleLaunch(state) {
  const readiness = checkLaunchReadiness(state.campaign);
  if (!readiness.ready) {
    return { ...state, launch: { success: false, missing: readiness.missing } };
  }
  return {
    ...state,
    campaign: postLaunchState(state.campaign),
    launch: launchCampaign(state.campaign)
  };
}

export function updateUsage(state, creditsUsed = 0) {
  if (!state.subscription) return state;
  const subscription = updateSubscriptionUsage(state.subscription, creditsUsed);
  return {
    ...state,
    subscription,
    credits: buildCreditSummary(subscription)
  };
}

export function openPlatformSwitch(state, platformName, adList = []) {
  return {
    ...state,
    platformSwitchModal: buildPlatformSwitchWarning(platformName, adList)
  };
}
