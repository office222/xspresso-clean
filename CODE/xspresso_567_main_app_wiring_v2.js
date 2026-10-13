// Xspresso - Main App Wiring (v2)
// Purpose: Lightweight app composition helpers for dashboard, builder, monitoring, and panels.

import { createLead } from './xspresso_564_lead_followup_screen_v2.js';
import { createBillingState } from './xspresso_563_billing_credits_panel_v2.js';

export function createAppState(user = {}) {
  return {
    user: {
      id: user.id || 'user_001',
      name: user.name || 'Welcome back',
    },
    navigation: {
      current: 'dashboard',
      items: ['Dashboard', 'Create Campaign', 'Monitoring', 'Leads', 'Library', 'Templates', 'Credits', 'Billing', 'Settings', 'Help'],
    },
    campaigns: [],
    leads: [],
    alerts: [],
    billing: createBillingState(user.planKey || 'starter', user.cycle || 'monthly'),
    ui: {
      selectedCampaignId: null,
      selectedSection: null,
      modalOpen: null,
      busy: false,
    },
  };
}

export function addCampaign(appState, campaign) {
  return { ...appState, campaigns: [...appState.campaigns, campaign] };
}

export function addLead(appState, leadData) {
  return { ...appState, leads: [...appState.leads, createLead(leadData)] };
}

export function addAlert(appState, alert) {
  return { ...appState, alerts: [alert, ...appState.alerts] };
}

export function selectCampaign(appState, campaignId) {
  return { ...appState, ui: { ...appState.ui, selectedCampaignId: campaignId } };
}

export function openModal(appState, modalName) {
  return { ...appState, ui: { ...appState.ui, modalOpen: modalName } };
}

export function closeModal(appState) {
  return { ...appState, ui: { ...appState.ui, modalOpen: null } };
}

export function setBusy(appState, busy = true) {
  return { ...appState, ui: { ...appState.ui, busy } };
}
