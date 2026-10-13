// xspresso_530_platform_switcher.js
// Platform switch helper logic for Xspresso V1

export function buildPlatformSwitchWarning(platformName, adList = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: `Choose which ads you want Xspresso to keep tracking, or choose the option that fits your ads best.`,
    platform: platformName,
    ads: adList,
    options: [
      "Keep running all ads — I will track them myself",
      `Delete all ads from ${platformName} and move them to my library`,
      `Keep monitoring all ads on ${platformName} for a usage cost`,
      "I will monitor them myself",
    ],
  };
}

export function calculateMonitoringCost(adCount, ratePerAdPerDay = 5) {
  return adCount * ratePerAdPerDay;
}

export function confirmPlatformSwitch(platformName, action, selectedAds = []) {
  return {
    platform: platformName,
    action,
    selectedAds,
    confirmedAt: new Date().toISOString(),
  };
}
