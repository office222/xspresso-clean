// xspresso_720_campaign_store.js
// In-memory campaign store helpers.

import { makeId, nowIso } from './xspresso_719_api_bootstrap.js';

const campaigns = new Map();

export function createCampaign(input = {}) {
  const id = input.id || makeId('cmp');
  const campaign = {
    id,
    name: input.name || 'Untitled Campaign',
    productName: input.productName || '',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || '',
    audience: input.audience || '',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    status: input.status || 'draft',
    createdAt: input.createdAt || nowIso(),
    updatedAt: nowIso(),
    versions: input.versions || [],
  };

  campaigns.set(id, campaign);
  return campaign;
}

export function getCampaign(id) {
  return campaigns.get(id) || null;
}

export function listCampaigns() {
  return Array.from(campaigns.values());
}

export function updateCampaign(id, patch = {}) {
  const existing = campaigns.get(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...patch,
    updatedAt: nowIso(),
  };
  campaigns.set(id, updated);
  return updated;
}

export function saveCampaignVersion(id, note = '') {
  const existing = campaigns.get(id);
  if (!existing) return null;

  const snapshot = {
    versionId: makeId('ver'),
    savedAt: nowIso(),
    note,
    data: { ...existing },
  };

  const versions = [...(existing.versions || []), snapshot];
  const updated = { ...existing, versions, updatedAt: nowIso() };
  campaigns.set(id, updated);
  return snapshot;
}
