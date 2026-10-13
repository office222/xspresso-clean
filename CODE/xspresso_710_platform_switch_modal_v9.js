// Xspresso Platform Switch Modal v9
// Warns users when they switch away from a platform and lets them choose what happens to each ad.

export const SwitchAction = {
  KEEP_RUNNING: 'keep_running',
  MOVE_TO_LIBRARY: 'move_to_library',
  MONITOR: 'monitor',
  STOP_TRACKING: 'stop_tracking'
};

export function buildPlatformSwitchWarning(platformName = 'Platform', ads = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: 'Choose what you want to do with each ad before switching.',
    platform: platformName,
    ads,
    options: [
      'Keep running all ads — I will track them myself',
      `Delete all ads from ${platformName} and move them to my library`,
      `Keep monitoring all ads on ${platformName} for a usage cost`,
      'I will monitor them myself'
    ]
  };
}

export function buildAdChoice(ad = {}) {
  return {
    adId: ad.id,
    adName: ad.name || 'Untitled Ad',
    actions: [
      { label: 'Keep running', value: SwitchAction.KEEP_RUNNING },
      { label: 'Move to library', value: SwitchAction.MOVE_TO_LIBRARY },
      { label: 'Keep Xspresso monitoring this ad', value: SwitchAction.MONITOR },
      { label: 'I will track this myself', value: SwitchAction.STOP_TRACKING }
    ]
  };
}

export function estimateMonitoringCost(adCount = 0, dailyRate = 5) {
  return adCount * dailyRate;
}
