export function buildPlatformSwitchModal(platformName, ads = []) {
  return {
    title: `Switching off ${platformName} will stop Xspresso tracking there.`,
    message: 'Choose what you want Xspresso to do with each ad.',
    platformName,
    ads: ads.map(ad => ({
      id: ad.id,
      name: ad.name,
      status: ad.status || 'running'
    })),
    options: [
      'Keep running all ads — I will track them myself',
      `Delete all ads from ${platformName} and move them to my library`,
      `Keep monitoring all ads on ${platformName} for a usage cost`,
      'I will monitor them myself'
    ]
  };
}
