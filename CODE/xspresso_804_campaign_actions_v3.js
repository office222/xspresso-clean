export function campaignActions(campaign = {}) {
  return {
    view: { label: 'View', enabled: true },
    edit: { label: 'Edit', enabled: true },
    duplicate: { label: 'Duplicate', enabled: true },
    regenerate: { label: 'Regenerate', enabled: campaign.status !== 'live' },
    launch: { label: 'Launch', enabled: campaign.status === 'ready_to_launch' },
    pause: { label: 'Pause', enabled: campaign.status === 'live' },
    export: { label: 'Export', enabled: true }
  };
}

export function canLaunch(campaign = {}) {
  return Boolean(campaign.headline && campaign.landingPage && campaign.adCopy);
}
