import { buildDashboardWidgets } from './xspresso_768_dashboard_widgets_v12.js';
import { getCampaignActions } from './xspresso_769_campaign_actions_v2.js';
import { createNotification } from './xspresso_770_notifications_center_v8.js';

export function bootstrapApp(state = {}) {
  const dashboardWidgets = buildDashboardWidgets(state);
  const firstCampaign = (state.campaigns || [])[0] || {};
  const campaignActions = getCampaignActions(firstCampaign);
  const notifications = [
    createNotification({
      title: 'Xspresso is ready',
      message: 'Build your campaign, launch, and monitor in one place.'
    })
  ];

  return {
    dashboardWidgets,
    campaignActions,
    notifications,
    ready: true
  };
}
