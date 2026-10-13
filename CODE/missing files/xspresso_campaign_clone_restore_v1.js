/**
 * Campaign cloning, export/import validation, and version restore helpers.
 * ES module; caller supplies persistence. Clones are drafts with regenerated IDs.
 */

const FORBIDDEN_IMPORT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function cloneCampaign(source, { newId = makeId('campaign'), name, now = new Date().toISOString() } = {}) {
  assertObject(source, 'Campaign');
  const copy = deepClone(source);
  copy.id = newId;
  copy.name = name || `${String(source.name || 'Untitled campaign')} copy`;
  copy.status = 'draft';
  copy.createdAt = now;
  copy.updatedAt = now;
  delete copy.launchedAt;
  delete copy.platformCampaignIds;
  delete copy.remoteIds;
  copy.ads = Array.isArray(copy.ads) ? copy.ads.map(ad => ({ ...ad, id: makeId('ad'), status: 'draft', remoteId: null })) : [];
  copy.versions = [];
  return copy;
}

export function createCampaignSnapshot(campaign, { actorId = null, note = '', now = new Date().toISOString() } = {}) {
  assertObject(campaign, 'Campaign');
  return Object.freeze({ id: makeId('version'), campaignId: campaign.id,
    version: Number(campaign.version || 0) + 1, actorId, note: String(note).slice(0, 500),
    createdAt: now, data: deepClone(campaign) });
}

export function restoreCampaignSnapshot(snapshot, { newVersion = true, now = new Date().toISOString() } = {}) {
  assertObject(snapshot?.data, 'Snapshot data');
  const restored = deepClone(snapshot.data);
  restored.status = 'draft';
  restored.updatedAt = now;
  delete restored.launchedAt;
  delete restored.platformCampaignIds;
  if (newVersion) restored.version = Math.max(Number(restored.version || 0), Number(snapshot.version || 0)) + 1;
  return restored;
}

export function exportCampaign(campaign) {
  assertObject(campaign, 'Campaign');
  const safe = deepClone(campaign);
  delete safe.platformCampaignIds;
  delete safe.remoteIds;
  return JSON.stringify({ format: 'xspresso-campaign', schemaVersion: 1, exportedAt: new Date().toISOString(), campaign: safe }, null, 2);
}

export function importCampaign(json, { maxBytes = MAX_IMPORT_BYTES } = {}) {
  if (typeof json !== 'string') throw new TypeError('Import must be JSON text.');
  if (new TextEncoder().encode(json).byteLength > maxBytes) throw new RangeError('Import file is too large.');
  let parsed;
  try { parsed = JSON.parse(json, (key, value) => FORBIDDEN_IMPORT_KEYS.has(key) ? undefined : value); }
  catch { throw new SyntaxError('Campaign file is not valid JSON.'); }
  if (parsed?.format !== 'xspresso-campaign' || parsed?.schemaVersion !== 1) throw new TypeError('Unsupported Xspresso campaign format/version.');
  assertObject(parsed.campaign, 'Imported campaign');
  const campaign = deepClone(parsed.campaign);
  if (!Array.isArray(campaign.ads)) campaign.ads = [];
  campaign.id = makeId('campaign');
  campaign.status = 'draft';
  campaign.createdAt = new Date().toISOString();
  campaign.updatedAt = campaign.createdAt;
  delete campaign.launchedAt;
  delete campaign.platformCampaignIds;
  delete campaign.remoteIds;
  campaign.ads = campaign.ads.map(ad => ({ ...ad, id: makeId('ad'), status: 'draft', remoteId: null }));
  return campaign;
}

export class CampaignVersionService {
  constructor({ repository, clock = () => new Date() } = {}) {
    if (!repository) throw new TypeError('A version repository must be supplied.');
    this.repository = repository; this.clock = clock;
  }
  async save(campaign, actorId, note = '') {
    const snapshot = createCampaignSnapshot(campaign, { actorId, note, now: this.clock().toISOString() });
    await this.repository.insertSnapshot(snapshot);
    return snapshot;
  }
  async list(campaignId) { return this.repository.listSnapshots(campaignId); }
  async restore(campaignId, snapshotId) {
    const snapshot = await this.repository.getSnapshot(campaignId, snapshotId);
    if (!snapshot) throw new Error('Version not found.');
    const restored = restoreCampaignSnapshot(snapshot, { now: this.clock().toISOString() });
    await this.repository.saveCampaign(restored);
    return restored;
  }
}

function assertObject(value, label) { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`); }
function deepClone(value) { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
function makeId(prefix) { return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`; }
