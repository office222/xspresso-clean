// xspresso_825_campaign_actions.js
// Campaign action helpers for approve/edit/regenerate/launch flows.

export const CampaignAction = {
  APPROVE: 'approve',
  EDIT: 'edit',
  REGENERATE: 'regenerate',
  LAUNCH: 'launch',
  SAVE_DRAFT: 'save_draft',
  DUPLICATE: 'duplicate'
};

export function getCampaignActions(campaign) {
  const status = campaign?.status || 'draft';

  const base = [
    CampaignAction.EDIT,
    CampaignAction.SAVE_DRAFT,
    CampaignAction.DUPLICATE
  ];

  if (status === 'draft') {
    return [...base, CampaignAction.APPROVE, CampaignAction.REGENERATE, CampaignAction.LAUNCH];
  }

  if (status === 'ready_to_launch') {
    return [CampaignAction.APPROVE, CampaignAction.LAUNCH, ...base];
  }

  if (status === 'live') {
    return [CampaignAction.REGENERATE, CampaignAction.EDIT, CampaignAction.SAVE_DRAFT, CampaignAction.DUPLICATE];
  }

  return base;
}

export function labelCampaignAction(action) {
  switch (action) {
    case CampaignAction.APPROVE: return 'Approve';
    case CampaignAction.EDIT: return 'Edit';
    case CampaignAction.REGENERATE: return 'Regenerate';
    case CampaignAction.LAUNCH: return 'Launch';
    case CampaignAction.SAVE_DRAFT: return 'Save Draft';
    case CampaignAction.DUPLICATE: return 'Duplicate';
    default: return 'Action';
  }
}

export function canLaunchCampaign(campaign) {
  return Boolean(
    campaign?.headline &&
    campaign?.adCopy &&
    campaign?.landingPage &&
    campaign?.platform &&
    campaign?.creditsRemaining > 0
  );
}
