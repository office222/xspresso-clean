import { randomUUID } from 'node:crypto';
import { parseCampaignMetricsCsv, hashMetricsCsv } from './xspresso_imported_metrics_provider_v1.js';

function fail(status, code, message) { return Object.assign(new Error(message), { status, code }); }
function requireUser(user) {
  if (!user?.id || !user?.tenantId) throw fail(401, 'UNAUTHORIZED', 'Authentication is required.');
}

export class CampaignMetricsImportService {
  constructor({ store, clock = () => new Date().toISOString() } = {}) {
    if (!store) throw new TypeError('store is required.');
    this.store = store; this.clock = clock;
  }

  async linkExternalCampaign({ user, campaignId, platform, externalCampaignId, confirmAlreadyLive } = {}) {
    requireUser(user);
    if (confirmAlreadyLive !== true) throw fail(400, 'CONFIRM_LIVE_REQUIRED', 'Confirm that this campaign is already live on the external platform.');
    const allowed = new Set(['meta', 'google', 'linkedin', 'tiktok', 'other']);
    if (!allowed.has(platform)) throw fail(400, 'INVALID_PLATFORM', 'Choose a supported platform value.');
    if (typeof externalCampaignId !== 'string' || !externalCampaignId.trim() || externalCampaignId.length > 200) {
      throw fail(400, 'INVALID_EXTERNAL_CAMPAIGN_ID', 'externalCampaignId is required and must be at most 200 characters.');
    }
    const now = this.clock();
    return this.store.update(state => {
      const campaign = (state.campaigns || []).find(c => c.id === campaignId && c.tenantId === user.tenantId);
      if (!campaign) throw fail(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found.');
      campaign.platform = platform;
      campaign.externalCampaignId = externalCampaignId.trim();
      campaign.status = 'external_linked';
      campaign.externallyManaged = true;
      campaign.externalLinkedAt = now;
      campaign.updatedAt = now;
      state.auditEvents ||= [];
      state.auditEvents.push({ id: randomUUID(), tenantId: user.tenantId, actorId: user.id, type: 'campaign.external_linked', campaignId, platform, at: now });
      return { campaignId, platform, externalCampaignId: campaign.externalCampaignId, status: campaign.status, externalVerified: false };
    });
  }

  async importCsv({ user, campaignId, csv, idempotencyKey } = {}) {
    requireUser(user);
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 160) {
      throw fail(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Provide an Idempotency-Key between 8 and 160 characters.');
    }
    const rows = parseCampaignMetricsCsv(csv);
    const contentHash = hashMetricsCsv(csv);
    const now = this.clock();
    return this.store.update(state => {
      state.metricsSnapshots ||= []; state.metricsImports ||= []; state.auditEvents ||= [];
      const campaign = (state.campaigns || []).find(c => c.id === campaignId && c.tenantId === user.tenantId);
      if (!campaign) throw fail(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found.');
      if (!campaign.externalCampaignId || !campaign.externallyManaged) throw fail(409, 'CAMPAIGN_NOT_LINKED', 'Link an already-live external campaign before importing metrics.');
      const previous = state.metricsImports.find(item => item.tenantId === user.tenantId && item.idempotencyKey === idempotencyKey);
      if (previous) {
        if (previous.contentHash !== contentHash || previous.campaignId !== campaignId) throw fail(409, 'IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was already used for different import data.');
        return { importId: previous.id, imported: previous.rowCount, replayed: true, campaignId };
      }
      let inserted = 0; let replaced = 0;
      for (const row of rows) {
        const index = state.metricsSnapshots.findIndex(item => item.tenantId === user.tenantId && item.campaignId === campaignId && item.adId === row.adId && item.date === row.date && item.currency === row.currency);
        const snapshot = { ...row, id: index >= 0 ? state.metricsSnapshots[index].id : randomUUID(), tenantId: user.tenantId, campaignId, source: 'csv_import', importedAt: now };
        if (index >= 0) { state.metricsSnapshots[index] = snapshot; replaced++; }
        else { state.metricsSnapshots.push(snapshot); inserted++; }
      }
      const record = { id: randomUUID(), tenantId: user.tenantId, campaignId, actorId: user.id, idempotencyKey, contentHash, rowCount: rows.length, inserted, replaced, importedAt: now };
      state.metricsImports.push(record);
      if (state.metricsImports.length > 5000) state.metricsImports.splice(0, state.metricsImports.length - 5000);
      state.auditEvents.push({ id: randomUUID(), tenantId: user.tenantId, actorId: user.id, type: 'campaign.metrics_imported', campaignId, importId: record.id, rowCount: rows.length, at: now });
      return { importId: record.id, campaignId, imported: rows.length, inserted, replaced, replayed: false };
    });
  }
}
