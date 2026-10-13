// xspresso_625_main_app_init_v2.js

import { buildCampaignBrief, applyCampaignDefaults, validateCampaignBrief } from './xspresso_621_campaign_builder_v3.js';
import { checkLaunchReadiness } from './xspresso_623_launch_flow_v4.js';
import { evaluateAdHealth } from './xspresso_624_alerts_center_v7.js';

export function initAppState() {
  return {
    user: { name: "", creditsRemaining: 0 },
    campaigns: [],
    alerts: [],
    activities: [],
    settings: {
      tone: "simple",
      defaultGoal: "sales",
      monitoringEnabled: true,
    },
  };
}

export function createCampaignDraft(input) {
  const brief = applyCampaignDefaults(buildCampaignBrief(input));
  const validation = validateCampaignBrief(brief);
  return { brief, validation };
}

export function summarizeCampaign(campaign) {
  return {
    id: campaign.id,
    status: campaign.status,
    readyToLaunch: checkLaunchReadiness(campaign).ready,
    adHealth: evaluateAdHealth(campaign.primaryAd || {}),
  };
}
