import { CampaignState, getNextCampaignState } from './xspresso_520_campaign_state_machine.js';
import { createNotification, buildUnderperformingAdNotification } from './xspresso_521_notifications_center.js';
import { getDashboardSummary } from './xspresso_522_dashboard_router_v3.js';
import { helpTopics } from './xspresso_523_help_center_data_v2.js';

export function bootstrapProject() {
  return {
    appName: 'Xspresso',
    coreMessage: 'Done-for-you marketing that gets responses, builds your list, follows up automatically, and lets you stay in command.',
    defaultState: CampaignState.DRAFT,
    demoCampaign: {
      id: 'cmp_demo',
      name: 'Demo Campaign',
      status: CampaignState.DRAFT,
      headline: 'Wake up your marketing.',
      landingPage: true,
      platforms: ['general'],
      creditsRemaining: 100,
      monitoredAds: 1
    },
    helpTopics,
    notifications: [
      createNotification({
        title: 'Welcome to Xspresso',
        message: 'Approve what you like. Tweak what you want. We do the work.',
        level: 'info'
      }),
      buildUnderperformingAdNotification({ id: 'ad_demo_1', campaignId: 'cmp_demo' })
    ]
  };
}

export function demoStateTransition() {
  return getNextCampaignState(CampaignState.DRAFT, 'submit_for_review');
}

export function getDemoDashboard(user = { name: 'Demo User', creditsRemaining: 100 }, campaigns = []) {
  return getDashboardSummary(user, campaigns, []);
}
