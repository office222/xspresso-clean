// xspresso_675_app_state_store.js
// Centralized in-memory state store for Xspresso V1 app shell.

const XspressoState = {
  user: null,
  settings: {
    tone: 'simple',
    defaultGoal: 'sales',
    monitoringEnabled: true,
    cpcWarning: 1.5,
    cpcCritical: 2.0,
  },
  campaigns: [],
  alerts: [],
  leads: [],
  templates: [],
  billing: {
    plan: 'starter',
    creditsIncluded: 0,
    creditsUsed: 0,
    nextRenewal: null,
  },
};

export function getState() {
  return XspressoState;
}

export function setUser(user) {
  XspressoState.user = user;
  return XspressoState;
}

export function updateSettings(patch) {
  XspressoState.settings = { ...XspressoState.settings, ...patch };
  return XspressoState.settings;
}

export function addCampaign(campaign) {
  XspressoState.campaigns = [campaign, ...XspressoState.campaigns];
  return XspressoState.campaigns;
}

export function updateCampaign(campaignId, patch) {
  XspressoState.campaigns = XspressoState.campaigns.map((c) =>
    c.id === campaignId ? { ...c, ...patch } : c
  );
  return XspressoState.campaigns;
}

export function addAlert(alert) {
  XspressoState.alerts = [alert, ...XspressoState.alerts];
  return XspressoState.alerts;
}

export function addLead(lead) {
  XspressoState.leads = [lead, ...XspressoState.leads];
  return XspressoState.leads;
}

export function addTemplate(template) {
  XspressoState.templates = [template, ...XspressoState.templates];
  return XspressoState.templates;
}

export function updateBilling(patch) {
  XspressoState.billing = { ...XspressoState.billing, ...patch };
  return XspressoState.billing;
}

export function resetState() {
  XspressoState.user = null;
  XspressoState.campaigns = [];
  XspressoState.alerts = [];
  XspressoState.leads = [];
  XspressoState.templates = [];
  XspressoState.billing = {
    plan: 'starter',
    creditsIncluded: 0,
    creditsUsed: 0,
    nextRenewal: null,
  };
  return XspressoState;
}
