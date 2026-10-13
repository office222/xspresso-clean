// Xspresso Platform Switch Modal v2

export const SwitchAction = {
  KEEP_RUNNING: 'keep_running',
  MOVE_TO_LIBRARY: 'move_to_library',
  MONITOR: 'monitor',
  STOP_TRACKING: 'stop_tracking',
};

export function buildPlatformSwitchWarning(platformName, ads = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: 'Choose what you want to do with each ad.',
    platformName,
    ads,
    options: [
      'Keep running all ads — I will track them myself',
      `Delete all ads from ${platformName} and move them to my library`,
      `Keep monitoring all ads on ${platformName} for a usage cost`,
      'I will monitor them myself',
    ],
  };
}

export function buildAdChoice(ad) {
  return {
    adId: ad.id,
    adName: ad.name,
    actions: [
      { label: 'Keep running', value: SwitchAction.KEEP_RUNNING },
      { label: 'Delete from platform and move to library', value: SwitchAction.MOVE_TO_LIBRARY },
      { label: 'Keep Xspresso monitoring this ad', value: SwitchAction.MONITOR },
    ],
  };
}

export function getMonitoringCost(term, ratePerUnit) {
  if (term === 'daily') return ratePerUnit;
  if (term === 'weekly') return ratePerUnit * 7;
  if (term === 'monthly') return ratePerUnit * 30;
  return 0;
}

export function applyBulkPlatformAction(platformName, action) {
  switch (action) {
    case SwitchAction.KEEP_RUNNING:
      return { platformName, result: 'User will track ads themselves.' };
    case SwitchAction.MOVE_TO_LIBRARY:
      return { platformName, result: 'Ads will be deleted from the platform and moved to library.' };
    case SwitchAction.MONITOR:
      return { platformName, result: 'Xspresso will continue monitoring for a usage cost.' };
    default:
      return { platformName, result: 'No action selected.' };
  }
}
