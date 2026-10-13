// xspresso_828_platform_switch_modal.js
// Helpers for switching platforms and handling monitoring choices.

export function buildPlatformSwitchWarning(platformName, ads = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: 'Choose what you want to do with each ad before switching.',
    platformName,
    ads,
    options: [
      'Keep running all ads — I will track them myself',
      `Delete all ads from ${platformName} and move them to my library`,
      `Keep monitoring all ads on ${platformName} for a usage cost`,
      'I will monitor them myself'
    ]
  };
}

export function calculateMonitoringCost({ adCount = 0, ratePerAd = 5, period = 'daily' }) {
  const multiplier = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 1;
  return adCount * ratePerAd * multiplier;
}

export function buildAdChoices(ad) {
  return {
    adId: ad.id,
    adName: ad.name,
    actions: [
      { label: 'Keep running', value: 'keep_running' },
      { label: 'Delete from platform and move to library', value: 'move_to_library' },
      { label: 'Keep Xspresso monitoring this ad', value: 'monitor' }
    ]
  };
}
