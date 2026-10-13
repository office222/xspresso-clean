// xspresso_489_app_init.js
// App initialization wiring for Xspresso V1

import { loadSettings } from "./xspresso_487_settings_store.js";
import { buildDashboardSummary, evaluateCampaignAlerts } from "./xspresso_485_monitoring_dashboard.js";
import { buildNotificationFeed } from "./xspresso_486_notifications_center.js";

export function initializeApp(state = {}) {
  const settings = loadSettings(state.settings || {});
  const campaigns = state.campaigns || [];

  const alerts = campaigns.flatMap((campaign) => evaluateCampaignAlerts(campaign));
  const notifications = buildNotificationFeed(alerts);
  const dashboard = buildDashboardSummary({
    campaigns,
    creditsRemaining: state.creditsRemaining || 0,
    alerts,
  });

  return {
    settings,
    dashboard,
    alerts,
    notifications,
    ready: true,
    createdAt: new Date().toISOString(),
  };
}

export function getPrimaryActionForState(appState = {}) {
  if ((appState.alerts || []).length > 0) return "Review Alerts";
  if ((appState.campaigns || []).some((c) => c.status === "draft")) return "Review Drafts";
  if ((appState.campaigns || []).length === 0) return "Create Campaign";
  return "Launch Now";
}
