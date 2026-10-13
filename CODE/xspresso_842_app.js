// xspresso_842_app.js
import { buildCampaignFromBrief, launchReady } from './xspresso_838_campaign_api.js';
import { buildDashboardSummary } from './xspresso_839_dashboard_cards.js';
import { monitoringSweep } from './xspresso_840_monitoring_engine.js';
import { reviewState, approve, regenerate, reviewSummary } from './xspresso_841_review_panel.js';

const state = {
  campaigns: [],
  alerts: [],
  credits: { included: 500, used: 0 },
  user: { name: 'Xspresso User' }
};

export function seedDemo() {
  const campaign = buildCampaignFromBrief({
    name: 'Demo Campaign',
    productName: 'Demo Product',
    audience: 'small business owners',
    platform: 'facebook',
    goal: 'sales'
  });

  state.campaigns = [campaign];
  state.alerts = [];
  return campaign;
}

export function getDashboard() {
  return buildDashboardSummary(state);
}

export function getReview(campaignId) {
  const campaign = state.campaigns.find((c) => c.id === campaignId);
  return campaign ? reviewState(campaign) : null;
}

export function approveSection(campaignId, section) {
  const idx = state.campaigns.findIndex((c) => c.id === campaignId);
  if (idx < 0) return null;
  const campaign = state.campaigns[idx];
  const review = reviewState(campaign);
  const updated = approve(review, section);
  state.campaigns[idx] = { ...campaign, [section]: updated.sections[section].value, updatedAt: updated.updatedAt };
  return updated;
}

export function regenerateSection(campaignId, section, newValue) {
  const idx = state.campaigns.findIndex((c) => c.id === campaignId);
  if (idx < 0) return null;
  const campaign = state.campaigns[idx];
  const review = reviewState(campaign);
  const updated = regenerate(review, section, newValue);
  state.campaigns[idx] = { ...campaign, [section]: updated.sections[section].value, updatedAt: updated.updatedAt };
  return updated;
}

export function launchCampaign(campaignId) {
  const campaign = state.campaigns.find((c) => c.id === campaignId);
  if (!campaign) return { success: false, message: 'Campaign not found.' };
  const ready = launchReady(campaign);
  if (!ready.ready) return { success: false, message: 'Campaign is not ready.', missing: ready.missing };
  campaign.status = 'live';
  campaign.updatedAt = new Date().toISOString();
  return { success: true, campaign };
}

export function sweepMonitoring() {
  const ads = state.campaigns.flatMap((c) => c.ads || []);
  const result = monitoringSweep(ads);
  state.alerts = result.alerts;
  return result;
}

export function getState() {
  return structuredClone(state);
}

export function getReviewSummary(campaignId) {
  const review = getReview(campaignId);
  return review ? reviewSummary(review) : null;
}
