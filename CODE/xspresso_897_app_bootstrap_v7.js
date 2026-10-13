// Xspresso - App Bootstrap v7
// Wires state, routing, campaign builder, monitoring, and notifications together.

const { buildCampaignDraft } = require('./xspresso_892_campaign_builder_v9');
const { getSections, approveSection, regenerateSection, finalizeCampaign } = require('./xspresso_893_review_panel_v15');
const { resolveRoute } = require('./xspresso_894_dashboard_router_v5');
const { monitorCampaign } = require('./xspresso_895_monitoring_engine_v14');
const { buildFromAlert, buildFeed } = require('./xspresso_896_notifications_center_v10');

function createInitialState() {
  return {
    route: 'dashboard',
    campaign: null,
    notifications: [],
    alerts: [],
    creditsRemaining: 0,
    user: { name: 'Xspresso User' }
  };
}

function seedDemoCampaign() {
  return buildCampaignDraft({
    productName: 'Demo Offer',
    offerDescription: 'A demo product for testing Xspresso.',
    audience: 'founders and marketers',
    goal: 'sales',
    tone: 'simple',
    platform: 'Meta',
    platforms: ['Meta', 'TikTok']
  });
}

function hydrateNotificationsFromMonitoring(monitoringResult) {
  return (monitoringResult.alerts || [])
    .map(buildFromAlert)
    .filter(Boolean);
}

function bootstrapApp({ hash = '#dashboard' } = {}) {
  const state = createInitialState();
  state.route = resolveRoute(hash).view;
  state.campaign = seedDemoCampaign();

  const sections = getSections(state.campaign);
  state.campaign = approveSection(state.campaign, 'headlines');
  state.campaign = approveSection(state.campaign, 'hooks');
  state.campaign = regenerateSection(state.campaign, 'adCopy');

  const finalized = finalizeCampaign(state.campaign);
  state.campaign = finalized;

  const monitoring = monitorCampaign({
    id: finalized.id,
    ads: [{ id: 'ad_1', name: sections.headlines[0], cpc: 0.9, ctr: 0.7, clicks: 24, conversions: 0, active: true }]
  });

  state.alerts = monitoring.alerts || [];
  state.notifications = hydrateNotificationsFromMonitoring(monitoring);
  state.notifications = buildFeed(state.notifications);

  return state;
}

module.exports = {
  createInitialState,
  seedDemoCampaign,
  hydrateNotificationsFromMonitoring,
  bootstrapApp
};
