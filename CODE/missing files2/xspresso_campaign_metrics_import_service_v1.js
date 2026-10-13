import { randomUUID } from 'node:crypto';
import { hashCsv, parseMetricsCsv } from './xspresso_imported_metrics_provider_v1.js';

const PLATFORMS = new Set(['meta', 'google', 'linkedin', 'tiktok', 'other']);

/** Tenant-scoped CSV import and explicit linking of an already-live external campaign. */
export class CampaignMetricsImportService {
  constructor({ store, clock = () => Date.now() } = {}) {
    if (!store) throw new TypeError('store is required.');
    this.store = store; this.clock = clock;
  }

  async linkExternalCampaign({ user, campaignId, platform, externalCampaignId, confirmAlreadyLive } = {}) {
    if (!user?.tenantId || !user?.id) throw fault('UNAUTHORIZED', 401, 'Sign in to continue.');
    if (confirmAlreadyLive !== true) throw fault('EXTERNAL_STATUS_CONFIRMATION_REQUIRED', 400, 'Confirm that this campaign is already live on the external platform.');
    if (!PLATFORMS.has(platform)) throw fault('INVALID_PLATFORM', 400, 'Choose a supported platform label.');
    const externalId = String(externalCampaignId || '').trim();
    if (!externalId || externalId.length > 180 || /[\u0000-\u001f\u007f]/.test(externalId)) throw fault('INVALID_EXTERNAL_CAMPAIGN_ID', 400, 'externalCampaignId is invalid.');
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      const campaign = (state.campaigns || []).find(row => row.id === campaignId && row.tenantId === user.tenantId);
      if (!campaign) throw fault('CAMPAIGN_NOT_FOUND', 404, 'Campaign not found.');
      campaign.platform = platform;
      campaign.externalCampaignId = externalId;
      campaign.status = 'external_linked';
      campaign.externallyManaged = true;
      campaign.externalLinkedAt = now;
      campaign.updatedAt = now;
      state.auditEvents ||= [];
      state.auditEvents.push({ id: randomUUID(), tenantId: user.tenantId, actorId: user.id, action: 'campaign.external_linked', resourceId: campaignId, at: now });
      return campaign;
    });
  }

  async importCsv({ user, campaignId, csv, idempotencyKey } = {}) {
    if (!user?.tenantId || !user?.id) throw fault('UNAUTHORIZED', 401, 'Sign in to continue.');
    const key = String(idempotencyKey || '').trim();
    if (key.length < 8 || key.length > 160) throw fault('IDEMPOTENCY_KEY_REQUIRED', 400, 'Provide an Idempotency-Key between 8 and 160 characters.');
    const rows = parseMetricsCsv(csv);
    const fileHash = hashCsv(csv);
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      state.campaigns ||= []; state.metricsSnapshots ||= []; state.metricsImports ||= []; state.auditEvents ||= [];
      const campaign = state.campaigns.find(row => row.id === campaignId && row.tenantId === user.tenantId);
      if (!campaign) throw fault('CAMPAIGN_NOT_FOUND', 404, 'Campaign not found.');
      if (!campaign.externalCampaignId || campaign.status !== 'external_linked') throw fault('CAMPAIGN_NOT_LINKED', 409, 'Link a campaign already live on an external platform before importing performance metrics.');
      const previous = state.metricsImports.find(row => row.tenantId === user.tenantId && row.idempotencyKey === key);
      if (previous) {
        if (previous.fileHash !== fileHash || previous.campaignId !== campaignId) throw fault('IDEMPOTENCY_KEY_REUSED', 409, 'This idempotency key was already used for different data.');
        return { ...previous, replayed: true };
      }
      let inserted = 0; let replaced = 0;
      for (const row of rows) {
        const existing = state.metricsSnapshots.find(snapshot => snapshot.tenantId === user.tenantId && snapshot.campaignId === campaignId && snapshot.adId === row.adId && snapshot.date === row.date && snapshot.currency === row.currency);
        const snapshot = { tenantId: user.tenantId, campaignId, ...row, source: 'csv_import', importedAt: now, importedBy: user.id };
        if (existing) { Object.assign(existing, snapshot); replaced++; }
        else { state.metricsSnapshots.push({ id: randomUUID(), ...snapshot }); inserted++; }
      }
      const result = { id: randomUUID(), tenantId: user.tenantId, campaignId, idempotencyKey: key, fileHash, rows: rows.length, inserted, replaced, importedAt: now, replayed: false };
      state.metricsImports.push(result);
      if (state.metricsImports.length > 5000) state.metricsImports.splice(0, state.metricsImports.length - 5000);
      state.auditEvents.push({ id: randomUUID(), tenantId: user.tenantId, actorId: user.id, action: 'campaign.metrics_csv_imported', resourceId: campaignId, rows: rows.length, at: now });
      return result;
    });
  }
}
function fault(code, status, message) { return Object.assign(new Error(message), { code, status }); }
