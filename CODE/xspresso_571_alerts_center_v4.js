// Xspresso alerts center
// File: xspresso_571_alerts_center_v4.js

export function createAlert({ title, message, level = 'warning', campaignId = null, adId = null } = {}) {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    message,
    level,
    campaignId,
    adId,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}

export function buildAlertsCenter(alerts = []) {
  return {
    unread: alerts.filter(a => a.status !== 'resolved').length,
    open: alerts.filter(a => a.status === 'open').length,
    alerts: alerts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };
}

export function getAlertAction(alert = {}) {
  if (alert.title === 'Underperforming ad') return 'Regenerate this ad';
  if (alert.title === 'CPC is rising') return 'Test a new headline';
  if (alert.title === 'Tracking paused') return 'Reconnect tracking';
  return 'Review campaign';
}

export function resolveAlert(alert) {
  return { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() };
}

export function dismissAlert(alert) {
  return { ...alert, status: 'dismissed', dismissedAt: new Date().toISOString() };
}