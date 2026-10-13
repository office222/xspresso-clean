export const CampaignAction = {
  VIEW: 'view',
  EDIT: 'edit',
  DUPLICATE: 'duplicate',
  PAUSE: 'pause',
  REGNERATE: 'regenerate',
  EXPORT: 'export',
  MONITOR: 'monitor'
};

export function getCampaignActions(campaign = {}) {
  const actions = [
    { label: 'View', value: CampaignAction.VIEW },
    { label: 'Edit', value: CampaignAction.EDIT },
    { label: 'Duplicate', value: CampaignAction.DUPLICATE },
    { label: 'Pause', value: CampaignAction.PAUSE },
    { label: 'Regenerate', value: CampaignAction.REGNERATE },
    { label: 'Export', value: CampaignAction.EXPORT }
  ];

  if (campaign.status === 'live') {
    actions.push({ label: 'Monitor', value: CampaignAction.MONITOR });
  }

  return actions;
}
