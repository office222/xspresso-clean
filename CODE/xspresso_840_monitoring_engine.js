// xspresso_840_monitoring_engine.js
import { scoreAd, nowIso, uid } from './xspresso_837_utils.js';

export function evaluateAd(ad = {}) {
  const score = scoreAd(ad);
  const issues = [];

  if ((ad.conversions || 0) === 0 && (ad.clicks || 0) > 20) issues.push('No conversions after meaningful clicks');
  if ((ad.cpc || 0) > 1.5) issues.push('High CPC');
  if ((ad.ctr || 0) < 0.5) issues.push('Low CTR');

  const status = score >= 70 ? 'healthy' : score >= 45 ? 'warning' : 'underperforming';
  const recommendation = status === 'underperforming'
    ? 'Regenerate this ad with a new title, hook, or angle.'
    : status === 'warning'
      ? 'Try a new hook or lower-cost angle.'
      : 'Keep monitoring.';

  return { id: ad.id || uid('ad'), score, status, issues, recommendation, checkedAt: nowIso() };
}

export function buildAlertFromAd(ad = {}) {
  const result = evaluateAd(ad);
  if (result.status === 'healthy') return null;

  return {
    id: uid('alt'),
    title: result.status === 'underperforming' ? 'This ad is underperforming.' : 'This ad may need a tweak.',
    message: result.recommendation,
    level: result.status === 'underperforming' ? 'critical' : 'warning',
    adId: ad.id || null,
    status: 'open',
    createdAt: nowIso()
  };
}

export function monitoringSweep(ads = []) {
  const alerts = [];
  const report = ads.map((ad) => {
    const result = evaluateAd(ad);
    const alert = buildAlertFromAd(ad);
    if (alert) alerts.push(alert);
    return result;
  });
  return { report, alerts };
}
