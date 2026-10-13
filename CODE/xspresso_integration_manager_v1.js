/**
 * Integration registry and connection manager (ES module; no dependencies).
 * Secrets should be stored by a server-side secrets vault, never in browser
 * storage or returned from this service. Real OAuth/API adapters are injected.
 */

const VALID_STATUS = new Set(['disconnected', 'connecting', 'connected', 'error', 'needs_reauth']);

export class MemoryIntegrationRepository {
  constructor() { this.records = new Map(); }
  key(tenantId, integrationId) { return `${tenantId}:${integrationId}`; }
  async get(tenantId, integrationId) { return copy(this.records.get(this.key(tenantId, integrationId)) || null); }
  async list(tenantId) { return [...this.records.values()].filter(item => item.tenantId === tenantId).map(publicRecord); }
  async save(record) { this.records.set(this.key(record.tenantId, record.integrationId), copy(record)); return publicRecord(record); }
}

export class IntegrationManager {
  constructor({ repository = new MemoryIntegrationRepository(), adapters = {}, clock = () => new Date() } = {}) {
    this.repository = repository; this.adapters = new Map(Object.entries(adapters)); this.clock = clock;
  }
  register(integrationId, adapter) {
    if (!integrationId || !adapter || typeof adapter.connect !== 'function') throw new TypeError('Integration adapter must provide connect().');
    this.adapters.set(integrationId, adapter);
  }
  async list(tenantId) {
    required(tenantId, 'tenantId');
    const records = await this.repository.list(tenantId);
    return records.map(publicRecord);
  }
  async connect({ tenantId, integrationId, actorId, credentials = {}, config = {} }) {
    required(tenantId, 'tenantId'); required(integrationId, 'integrationId');
    const adapter = this.adapters.get(integrationId);
    if (!adapter) throw new Error(`No adapter registered for ${integrationId}.`);
    const existing = await this.repository.get(tenantId, integrationId);
    const record = { ...(existing || {}), tenantId, integrationId, status: 'connecting',
      connectedBy: actorId || null, config: sanitizeConfig(config), updatedAt: this.clock().toISOString(),
      lastError: null };
    await this.repository.save(record);
    try {
      // Adapter returns non-secret metadata and a credential reference. Persist
      // secrets only in a trusted server-side vault behind the adapter.
      const result = await adapter.connect({ tenantId, credentials, config });
      record.status = 'connected';
      record.accountLabel = String(result?.accountLabel || '').slice(0, 200) || null;
      record.externalAccountId = result?.externalAccountId ? String(result.externalAccountId).slice(0, 200) : null;
      record.credentialRef = result?.credentialRef || null;
      record.connectedAt = this.clock().toISOString(); record.updatedAt = record.connectedAt;
      await this.repository.save(record);
      return publicRecord(record);
    } catch (error) {
      record.status = 'error'; record.lastError = safeError(error); record.updatedAt = this.clock().toISOString();
      await this.repository.save(record);
      throw error;
    }
  }
  async disconnect({ tenantId, integrationId }) {
    const record = await this.repository.get(tenantId, integrationId);
    if (!record) return false;
    const adapter = this.adapters.get(integrationId);
    if (adapter?.disconnect) await adapter.disconnect({ tenantId, credentialRef: record.credentialRef });
    record.status = 'disconnected'; record.credentialRef = null; record.updatedAt = this.clock().toISOString();
    await this.repository.save(record); return true;
  }
  async healthCheck({ tenantId, integrationId }) {
    const record = await this.repository.get(tenantId, integrationId);
    if (!record) return { integrationId, status: 'disconnected', checkedAt: this.clock().toISOString() };
    const adapter = this.adapters.get(integrationId);
    if (record.status !== 'connected' || !adapter?.healthCheck) return { ...publicRecord(record), checkedAt: this.clock().toISOString() };
    try {
      const result = await adapter.healthCheck({ tenantId, credentialRef: record.credentialRef });
      if (result?.needsReauth) record.status = 'needs_reauth';
      record.lastCheckedAt = this.clock().toISOString(); record.updatedAt = record.lastCheckedAt;
      await this.repository.save(record);
      return { ...publicRecord(record), checkedAt: record.lastCheckedAt };
    } catch (error) {
      record.status = 'error'; record.lastError = safeError(error); record.lastCheckedAt = this.clock().toISOString();
      await this.repository.save(record); return { ...publicRecord(record), checkedAt: record.lastCheckedAt };
    }
  }
}

export function validateIntegrationStatus(status) { if (!VALID_STATUS.has(status)) throw new TypeError('Invalid integration status.'); return status; }
function publicRecord(record) {
  const { credentialRef, accessToken, refreshToken, clientSecret, credentials, ...safe } = record;
  return { ...safe, hasCredential: Boolean(credentialRef) };
}
function sanitizeConfig(config) { return Object.fromEntries(Object.entries(config || {}).filter(([key]) => !/(secret|token|password|key)/i.test(key))); }
function safeError(error) { return String(error?.message || 'Integration request failed.').slice(0, 300); }
function required(value, name) { if (!String(value || '').trim()) throw new TypeError(`${name} is required.`); }
function copy(value) { return value == null ? value : (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value))); }
