// xspresso_548_platform_switch_modal.js
// Platform switch modal helpers for Xspresso

export const SwitchAction = {
  KEEP_RUNNING: 'keep_running',
  MOVE_TO_LIBRARY: 'move_to_library',
  MONITOR: 'monitor',
  STOP_TRACKING: 'stop_tracking',
};

export function buildPlatformSwitchWarning(platformName, adList = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: 'Choose which ads you want Xspresso to keep tracking, or choose the option that fits your ads best.',
    platform: platformName,
    ads: adList,
    options: [
      'Keep running all ads — I will track them myself',
      `Delete all ads from ${platformName} and move them to my library`,
      `Keep monitoring all ads on ${platformName} for a usage cost`,
      'I will monitor them myself',
    ],
  };
}

export function buildAdChoice(ad = {}) {
  return {
    adId: ad.id,
    adName: ad.name || 'Untitled Ad',
    actions: [
      { label: 'Keep running', value: SwitchAction.KEEP_RUNNING },
      { label: 'Delete from platform and move to library', value: SwitchAction.MOVE_TO_LIBRARY },
      { label: 'Keep Xspresso monitoring this ad', value: SwitchAction.MONITOR },
      { label: 'I will track this myself', value: SwitchAction.STOP_TRACKING },
    ],
  };
}

export function getMonitoringCost(term = 'daily', creditRate = 5) {
  if (term === 'daily') return creditRate;
  if (term === 'weekly') return creditRate * 7;
  if (term === 'monthly') return creditRate * 30;
  return 0;
}
