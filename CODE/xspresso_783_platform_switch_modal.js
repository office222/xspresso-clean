// xspresso_783_platform_switch_modal.js
// Platform switch warning and options

export const PLATFORM_MONITORING_COST = {
  daily: 5,
  weekly: 30,
  monthly: 100
};

export function buildPlatformSwitchWarning(platformName, ads = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: `Choose what you want to do with each ad on ${platformName}.`,
    platformName,
    ads,
    options: [
      { value: "keep_running", label: "Keep running — I will track them myself" },
      { value: "move_to_library", label: `Delete from ${platformName} and move to library` },
      { value: "monitor", label: `Keep monitoring on ${platformName} for a usage cost` }
    ]
  };
}

export function calculateMonitoringCost(term = "monthly", adCount = 1) {
  return (PLATFORM_MONITORING_COST[term] || 0) * adCount;
}

export function applyPlatformSwitchAction(ads = [], action = "keep_running") {
  return ads.map(ad => ({
    ...ad,
    platformAction: action,
    monitoringEnabled: action === "monitor",
    movedToLibrary: action === "move_to_library"
  }));
}
