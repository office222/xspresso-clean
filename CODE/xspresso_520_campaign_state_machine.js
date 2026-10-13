export const CampaignState = Object.freeze({
  DRAFT: 'draft',
  REVIEW: 'review',
  READY: 'ready',
  LIVE: 'live',
  UNDERPERFORMING: 'underperforming',
  PAUSED: 'paused',
  ARCHIVED: 'archived'
});

export function getNextCampaignState(currentState, event) {
  switch (currentState) {
    case CampaignState.DRAFT:
      if (event === 'submit_for_review') return CampaignState.REVIEW;
      break;
    case CampaignState.REVIEW:
      if (event === 'approve') return CampaignState.READY;
      if (event === 'edit') return CampaignState.DRAFT;
      break;
    case CampaignState.READY:
      if (event === 'launch') return CampaignState.LIVE;
      if (event === 'edit') return CampaignState.DRAFT;
      break;
    case CampaignState.LIVE:
      if (event === 'underperforming') return CampaignState.UNDERPERFORMING;
      if (event === 'pause') return CampaignState.PAUSED;
      break;
    case CampaignState.UNDERPERFORMING:
      if (event === 'regenerate') return CampaignState.DRAFT;
      if (event === 'pause') return CampaignState.PAUSED;
      break;
    case CampaignState.PAUSED:
      if (event === 'resume') return CampaignState.LIVE;
      if (event === 'archive') return CampaignState.ARCHIVED;
      break;
    default:
      break;
  }

  return currentState;
}

export function canLaunchCampaign(campaign) {
  return Boolean(
    campaign?.headline &&
    campaign?.landingPage &&
    campaign?.platforms?.length &&
    campaign?.creditsRemaining > 0
  );
}

export function buildCampaignStateMessage(state) {
  switch (state) {
    case CampaignState.DRAFT:
      return 'Draft saved. Review and tweak when ready.';
    case CampaignState.REVIEW:
      return 'Campaign is ready for approval.';
    case CampaignState.READY:
      return 'Campaign is ready to launch.';
    case CampaignState.LIVE:
      return 'Campaign is live and being monitored.';
    case CampaignState.UNDERPERFORMING:
      return 'This campaign is underperforming. Improve before spending more credits.';
    case CampaignState.PAUSED:
      return 'Campaign paused.';
    case CampaignState.ARCHIVED:
      return 'Campaign archived.';
    default:
      return 'Unknown campaign state.';
  }
}
