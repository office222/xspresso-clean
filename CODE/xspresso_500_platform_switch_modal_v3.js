export function buildPlatformSwitchWarning(platformName, ads = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: 'Choose what you want to do with your ads before you switch.',
    platformName,
    ads,
    options: [
      'Keep running all ads — I will track them myself',
      `Delete ads from ${platformName} and move them to my library`,
      `Keep monitoring ads on ${platformName} for a usage cost`,
      'I will monitor them myself'
    ]
  };
}

export function buildAdChoice(ad) {
  return {
    adId: ad.id,
    adName: ad.name,
    actions: [
      { label: 'Keep running', value: 'keep_running' },
      { label: 'Delete from platform and move to library', value: 'move_to_library' },
      { label: 'Keep monitoring this ad', value: 'monitor' }
    ]
  };
}

export function calculateMonitoringCost(term, rate) {
  if (term === 'daily') return rate;
  if (term === 'weekly') return rate * 7;
  if (term === 'monthly') return rate * 30;
  return 0;
}
