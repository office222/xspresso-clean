export function buildPlatformSwitchModal({ platformName, ads = [], dailyRate = 5, weeklyRate = 30, monthlyRate = 100 }) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: `Choose what to do with your ads on ${platformName}.`,
    options: [
      { label: 'Keep running — I will track them myself', value: 'keep_running' },
      { label: `Delete from ${platformName} and move to my library`, value: 'move_to_library' },
      { label: `Keep monitoring all ads on ${platformName}`, value: 'monitor' },
      { label: 'I will monitor them myself', value: 'self_manage' }
    ],
    pricing: { dailyRate, weeklyRate, monthlyRate },
    adCount: ads.length,
    ads: ads.map(ad => ({ id: ad.id, name: ad.name, status: ad.status || 'running' }))
  };
}

export function calculateSwitchCost({ term = 'daily', monitoredAds = 0, dailyRate = 5, weeklyRate = 30, monthlyRate = 100 }) {
  const rate = term === 'weekly' ? weeklyRate : term === 'monthly' ? monthlyRate : dailyRate;
  return monitoredAds * rate;
}
