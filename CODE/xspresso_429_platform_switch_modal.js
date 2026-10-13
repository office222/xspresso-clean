// xspresso_429_platform_switch_modal.js
// Platform switch warning and action helpers for Xspresso

export const SwitchAction = {
  KEEP_RUNNING: "keep_running",
  MOVE_TO_LIBRARY: "move_to_library",
  MONITOR: "monitor",
  STOP_TRACKING: "stop_tracking",
};

export function buildPlatformSwitchWarning(platformName, ads = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: "Choose which ads you want Xspresso to keep tracking, or choose the option that fits each ad best.",
    platform: platformName,
    ads,
    options: [
      { label: "Keep running all ads — I will track them myself", value: SwitchAction.KEEP_RUNNING },
      { label: `Delete all ads from ${platformName} and move them to my library`, value: SwitchAction.MOVE_TO_LIBRARY },
      { label: `Keep monitoring all ads on ${platformName} for a usage cost`, value: SwitchAction.MONITOR },
      { label: "I will monitor them myself", value: SwitchAction.STOP_TRACKING },
    ],
  };
}

export function buildPerAdActions(ad) {
  return {
    adId: ad.id,
    adName: ad.name,
    actions: [
      { label: "Keep running", value: SwitchAction.KEEP_RUNNING },
      { label: "Delete from platform and move to library", value: SwitchAction.MOVE_TO_LIBRARY },
      { label: "Keep Xspresso monitoring this ad", value: SwitchAction.MONITOR },
    ],
  };
}

export function estimateMonitoringCost(term, ratePerDay = 5) {
  if (term === "daily") return ratePerDay;
  if (term === "weekly") return ratePerDay * 7;
  if (term === "monthly") return ratePerDay * 30;
  return 0;
}

export function applyBulkPlatformAction(platformName, action) {
  switch (action) {
    case SwitchAction.KEEP_RUNNING:
      return { platform: platformName, result: "User will track ads themselves." };
    case SwitchAction.MOVE_TO_LIBRARY:
      return { platform: platformName, result: "Ads will be deleted from the platform and moved to library." };
    case SwitchAction.MONITOR:
      return { platform: platformName, result: "Xspresso will continue monitoring for a usage cost." };
    default:
      return { platform: platformName, result: "No action selected." };
  }
}
