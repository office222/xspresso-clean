window.XspressoMonitoring = (() => {
  function evaluateAd(ad, settings = {}) {
    const cpcWarning = settings.cpcWarning ?? 1.5;
    const cpcCritical = settings.cpcCritical ?? 2.0;
    const alerts = [];

    if (ad.conversions === 0 && ad.clicks > 20) {
      alerts.push({
        level: 'critical',
        title: 'This ad is underperforming.',
        message: 'Improve it before spending more credits monitoring an ad that is not performing.',
        recommendation: 'Regenerate this ad with a new title, hook, or angle.'
      });
    }

    if (ad.cpc >= cpcCritical) {
      alerts.push({
        level: 'critical',
        title: 'CPC is high.',
        message: 'This campaign may need a stronger angle or a lower-cost variation.',
        recommendation: 'Test a new hook or headline.'
      });
    } else if (ad.cpc >= cpcWarning) {
      alerts.push({
        level: 'warning',
        title: 'CPC is rising.',
        message: 'This ad may need a tweak before you spend more credits.',
        recommendation: 'Try a new title or CTA.'
      });
    }

    return {
      healthy: alerts.length === 0,
      alerts
    };
  }

  function buildMonitorCard(ad, settings) {
    const result = evaluateAd(ad, settings);
    return {
      name: ad.name,
      platform: ad.platform,
      cpc: ad.cpc,
      clicks: ad.clicks,
      conversions: ad.conversions,
      status: result.healthy ? 'good' : result.alerts[0].level,
      alerts: result.alerts
    };
  }

  return { evaluateAd, buildMonitorCard };
})();
