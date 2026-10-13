// Xspresso - Platform Switch Modal (v2)
// Purpose: Confirm platform changes and define what happens to tracked ads.

export const PlatformSwitchAction = {
  KEEP_RUNNING: 'keep_running',
  MOVE_TO_LIBRARY: 'move_to_library',
  MONITOR: 'monitor',
  STOP_TRACKING: 'stop_tracking',
};

export function buildPlatformSwitchWarning(platformName, ads = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking ads there.`,
    message: 'Choose what you want to do with each ad before continuing.',
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

export function createAdChoice(ad) {
  return {
    adId: ad.id,
    adName: ad.name,
    currentPlatform: ad.platform,
    selectedAction: PlatformSwitchAction.KEEP_RUNNING,
    actions: [
      { label: 'Keep running', value: PlatformSwitchAction.KEEP_RUNNING },
      { label: 'Move to library', value: PlatformSwitchAction.MOVE_TO_LIBRARY },
      { label: 'Keep monitoring', value: PlatformSwitchAction.MONITOR },
      { label: 'Stop tracking', value: PlatformSwitchAction.STOP_TRACKING },
    ],
  };
}

export function calculateSwitchCost({ keepMonitoring = false, adCount = 0, dailyRate = 5, rush = false } = {}) {
  let cost = 0;
  if (keepMonitoring) cost += adCount * dailyRate;
  if (rush) cost += 20;
  return cost;
}

export function confirmPlatformSwitch(platformName, selectedAds = [], action = PlatformSwitchAction.KEEP_RUNNING) {
  return {
    platformName,
    selectedAds,
    action,
    confirmed: true,
    at: new Date().toISOString(),
  };
}
