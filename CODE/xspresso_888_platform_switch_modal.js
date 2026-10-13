export function buildPlatformSwitchNotice({ platformName, adCount = 0, keepMonitoringCost = 0 } = {}) {
  const name = platformName || 'the selected platform';
  return {
    title: `Warning: switching off ${name} will stop Xspresso from tracking your ads there.`,
    message: `Choose what to do with ${adCount} ad${adCount === 1 ? '' : 's'} on ${name}.`,
    details: {
      platformName: name,
      adCount,
      keepMonitoringCost,
    },
    options: [
      {
        id: 'keep_running',
        label: 'Keep running — I will track them myself',
        description: 'Remove Xspresso monitoring and leave the ads active.',
      },
      {
        id: 'delete_and_archive',
        label: `Delete from ${name} and move to library`,
        description: 'Move the ad setup into your library for later reuse.',
      },
      {
        id: 'keep_monitoring',
        label: `Keep monitoring on ${name}`,
        description: `Continue monitoring for ${keepMonitoringCost} credits`,
      },
      {
        id: 'monitor_myself',
        label: 'I will monitor them myself',
        description: 'Turn off Xspresso tracking for these ads.',
      },
    ],
  };
}

export function calculateMonitoringCost({ adCount = 0, ratePerAd = 5, cadence = 'daily' } = {}) {
  const cadenceMultiplier = {
    daily: 1,
    weekly: 7,
    monthly: 30,
  }[cadence] || 1;
  return adCount * ratePerAd * cadenceMultiplier;
}

export function getPlatformSwitchActions(platformName, selectedAds = []) {
  return selectedAds.map((ad) => ({
    adId: ad.id,
    adName: ad.name || ad.title || 'Untitled Ad',
    platformName,
    actions: ['keep_running', 'delete_and_archive', 'keep_monitoring', 'monitor_myself'],
  }));
}

export function summarizePlatformSwitch({ platformName, selectedAds = [], cadence = 'daily' } = {}) {
  const cost = calculateMonitoringCost({ adCount: selectedAds.length, cadence });
  return {
    platformName,
    selectedAds: selectedAds.length,
    cadence,
    cost,
    note: 'Switching platforms may pause Xspresso tracking unless monitoring is retained.',
  };
}
