// xspresso_478_monitoring_rules_v3.js
// Monitoring rules for Xspresso V1

export const monitoringDefaults = {
  cpcWarning: 1.5,
  cpcCritical: 2.0,
  ctrWarning: 0.8,
  ctrCritical: 0.5,
  clicksWithoutConversions: 20,
};

export function evaluateAdHealth(ad, settings = monitoringDefaults) {
  const warnings = [];

  if ((ad?.cpc ?? 0) >= settings.cpcCritical) {
    warnings.push({
      level: 'critical',
      title: 'CPC is too high',
      message: 'This ad may need a new title, hook, or angle.',
      action: 'Regenerate this ad',
    });
  } else if ((ad?.cpc ?? 0) >= settings.cpcWarning) {
    warnings.push({
      level: 'warning',
      title: 'CPC is rising',
      message: 'This ad may need a tweak before more credits are spent.',
      action: 'Review this ad',
    });
  }

  if ((ad?.ctr ?? 0) <= settings.ctrCritical) {
    warnings.push({
      level: 'critical',
      title: 'CTR is low',
      message: 'Try a stronger headline or hook.',
      action: 'Regenerate this ad',
    });
  } else if ((ad?.ctr ?? 0) <= settings.ctrWarning) {
    warnings.push({
      level: 'warning',
      title: 'CTR is weak',
      message: 'This ad may respond better to a new angle.',
      action: 'Test a new hook',
    });
  }

  if ((ad?.clicks ?? 0) > settings.clicksWithoutConversions && (ad?.conversions ?? 0) === 0) {
    warnings.push({
      level: 'critical',
      title: 'Underperforming ad',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      action: 'Regenerate this ad',
    });
  }

  return {
    status: warnings.some(w => w.level === 'critical') ? 'critical' : warnings.length ? 'warning' : 'healthy',
    warnings,
  };
}

export function recommendNextAction(ad) {
  const health = evaluateAdHealth(ad);
  if (health.status === 'critical') return 'Regenerate this ad with a new title, hook, or angle.';
  if (health.status === 'warning') return 'Try a new headline or hook.';
  return 'Keep monitoring.';
}
