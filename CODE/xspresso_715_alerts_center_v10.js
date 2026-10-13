import { createNotification } from './xspresso_713_notifications_center_v7.js';

export function evaluateCampaignAlerts(campaign = {}) {
  const alerts = [];

  if ((campaign.cpc || 0) > 2.0) {
    alerts.push(createNotification({
      title: 'CPC critical',
      message: 'CPC is high. Improve it before spending more credits.',
      level: 'critical',
      action: 'Try a new headline',
      campaignId: campaign.id
    }));
  }

  if ((campaign.conversions || 0) === 0 && (campaign.clicks || 0) > 20) {
    alerts.push(createNotification({
      title: 'Underperforming ad',
      message: 'This ad is underperforming. Regenerate it before spending more credits.',
      level: 'critical',
      action: 'Regenerate this ad',
      campaignId: campaign.id
    }));
  }

  if ((campaign.ctr || 0) < 0.8 && (campaign.clicks || 0) > 10) {
    alerts.push(createNotification({
      title: 'CTR low',
      message: 'Try a new hook or angle to lift click-through rate.',
      level: 'warning',
      action: 'Test a new hook',
      campaignId: campaign.id
    }));
  }

  return alerts;
}

export function buildAlertFeed(campaigns = []) {
  return campaigns.flatMap(c => evaluateCampaignAlerts(c));
}
