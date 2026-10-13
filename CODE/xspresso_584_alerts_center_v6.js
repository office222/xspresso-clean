// xspresso_584_alerts_center_v6.js
// Alerts and notifications for Xspresso.

import { evaluateAdHealth } from './xspresso_583_monitoring_engine_v6.js';

export function createAlert({ title, message, level = 'warning', campaignId = null, adId = null }) {
  return {
    id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    message,
    level,
    campaignId,
    adId,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}

export function alertsFromCampaigns(campaigns = []) {
  const alerts = [];

  campaigns.forEach(campaign => {
    (campaign.ads || []).forEach(ad => {
      const health = evaluateAdHealth(ad);
      if (health.level !== 'good') {
        alerts.push(createAlert({
          title: ad.name || 'Ad Alert',
          message: health.message,
          level: health.level,
          campaignId: campaign.id,
          adId: ad.id,
        }));
      }
    });
  });

  return alerts;
}

export function dismissAlert(alert) {
  return { ...alert, status: 'dismissed', dismissedAt: new Date().toISOString() };
}

export function resolveAlert(alert) {
  return { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() };
}

export function alertFeed(alerts = []) {
  return alerts
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(alert => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      level: alert.level,
      status: alert.status,
      action: alert.level === 'critical' ? 'Regenerate this ad' : 'Review this campaign',
    }));
}
