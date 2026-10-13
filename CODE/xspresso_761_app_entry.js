// xspresso_761_app_entry.js
// App entry wiring for Xspresso

import { createCampaignDraft, validateCampaignBrief } from './xspresso_762_campaign_builder_screen.js';
import { evaluateMonitoringState } from './xspresso_763_monitoring_engine_v12.js';
import { buildReviewState } from './xspresso_764_review_panel_v14.js';
import { buildBillingState } from './xspresso_765_billing_credits_panel_v11.js';
import { buildHelpTopics } from './xspresso_766_help_center_panel_v11.js';

export function createAppState() {
  return {
    user: { name: 'Welcome back', plan: 'starter' },
    campaign: null,
    monitoring: { alerts: [], status: 'idle' },
    review: { approvedSections: [], draftReady: false },
    billing: { creditsUsed: 0, creditsRemaining: 0 },
    help: { topics: [] },
  };
}

export function bootstrapXspresso(input = {}) {
  const brief = input.brief || {};
  const briefCheck = validateCampaignBrief(brief);
  const campaign = createCampaignDraft(brief);
  const monitoring = evaluateMonitoringState(input.metrics || {});
  const review = buildReviewState(campaign);
  const billing = buildBillingState(input.subscription || {});
  const help = buildHelpTopics();

  return {
    briefCheck,
    campaign,
    monitoring,
    review,
    billing,
    help,
  };
}

export function summarizeApp(app) {
  return {
    campaignName: app?.campaign?.productName || 'Untitled Offer',
    campaignStatus: app?.monitoring?.status || 'idle',
    alerts: app?.monitoring?.alerts?.length || 0,
    creditsRemaining: app?.billing?.creditsRemaining || 0,
    approvedSections: app?.review?.approvedSections?.length || 0,
  };
}
