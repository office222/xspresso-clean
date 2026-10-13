// xspresso_503_campaign_state_machine.js
// Simple state machine for the campaign lifecycle.

export const CampaignStatus = Object.freeze({
  DRAFT: 'draft',
  READY: 'ready',
  LIVE: 'live',
  MONITORING: 'monitoring',
  NEEDS_ATTENTION: 'needs_attention',
  PAUSED: 'paused',
  ARCHIVED: 'archived'
});

const transitions = {
  [CampaignStatus.DRAFT]: [CampaignStatus.READY, CampaignStatus.ARCHIVED],
  [CampaignStatus.READY]: [CampaignStatus.LIVE, CampaignStatus.DRAFT, CampaignStatus.ARCHIVED],
  [CampaignStatus.LIVE]: [CampaignStatus.MONITORING, CampaignStatus.PAUSED, CampaignStatus.ARCHIVED],
  [CampaignStatus.MONITORING]: [CampaignStatus.NEEDS_ATTENTION, CampaignStatus.PAUSED, CampaignStatus.ARCHIVED],
  [CampaignStatus.NEEDS_ATTENTION]: [CampaignStatus.DRAFT, CampaignStatus.READY, CampaignStatus.PAUSED, CampaignStatus.ARCHIVED],
  [CampaignStatus.PAUSED]: [CampaignStatus.READY, CampaignStatus.ARCHIVED],
  [CampaignStatus.ARCHIVED]: []
};

export function canTransition(from, to) {
  return (transitions[from] || []).includes(to);
}

export function transitionCampaign(campaign, nextStatus) {
  if (!campaign || !campaign.status) {
    throw new Error('campaign.status is required');
  }
  if (!canTransition(campaign.status, nextStatus)) {
    throw new Error(`Invalid transition from ${campaign.status} to ${nextStatus}`);
  }
  return {
    ...campaign,
    status: nextStatus,
    updatedAt: new Date().toISOString()
  };
}

export function isLaunchReady(campaign) {
  return Boolean(
    campaign &&
    campaign.headline &&
    campaign.adCopy &&
    campaign.landingPage &&
    campaign.platformVersion &&
    campaign.creditsRemaining > 0
  );
}
