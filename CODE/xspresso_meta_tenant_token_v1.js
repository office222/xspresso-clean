import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/** Encrypts per-tenant Meta credentials before they enter the JSON store. */
export class MetaTenantTokenVault {
  constructor({ store, encryptionKey } = {}) {
    if (!store || typeof store.read !== 'function' || typeof store.update !== 'function') throw new TypeError('A readable, writable store is required.');
    const key = Buffer.isBuffer(encryptionKey) ? Buffer.from(encryptionKey) : Buffer.from(String(encryptionKey || ''), 'base64');
    if (key.length !== 32) throw new TypeError('Meta credential encryption key must be 32 bytes (base64 encoded).');
    this.store = store; this.key = key;
  }
  async set({ tenantId, adAccountId, accessToken, currency }) {
    tenantId = requireText(tenantId, 'tenantId', 160);
    adAccountId = String(adAccountId || '').replace(/^act_/, '');
    if (!/^\d{4,40}$/.test(adAccountId)) throw fault('INVALID_AD_ACCOUNT', 400, 'adAccountId must contain digits only.');
    accessToken = requireText(accessToken, 'accessToken', 4096);
    if (accessToken.length < 20) throw fault('INVALID_ACCESS_TOKEN', 400, 'Meta access token is too short.');
    currency = String(currency || '').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw fault('INVALID_CURRENCY', 400, 'Currency must be a three-letter code.');
    const encrypted = encrypt(this.key, accessToken);
    const now = new Date().toISOString();
    return this.store.update(state => {
      state.providerCredentials ||= [];
      const prior = state.providerCredentials.find(x => x.provider === 'meta' && x.tenantId === tenantId);
      const record = { provider: 'meta', tenantId, adAccountId, currency, ...encrypted, updatedAt: now };
      if (prior) Object.assign(prior, record); else state.providerCredentials.push(record);
      state.auditEvents ||= [];
      state.auditEvents.push({ id: randomBytes(16).toString('hex'), tenantId, type: 'provider.meta.credentials.updated', at: now });
      return { provider: 'meta', tenantId, adAccountId, currency, updatedAt: now };
    });
  }
  async get(tenantId) {
    const state = await this.store.read();
    const record = (state.providerCredentials || []).find(x => x.provider === 'meta' && x.tenantId === tenantId);
    if (!record) throw fault('META_NOT_CONNECTED', 409, 'No Meta account is connected for this workspace.');
    try { return { tenantId, adAccountId: record.adAccountId, currency: record.currency, accessToken: decrypt(this.key, record) }; }
    catch { throw fault('META_CREDENTIALS_UNREADABLE', 500, 'Stored Meta credentials could not be decrypted.'); }
  }
  async remove(tenantId) {
    return this.store.update(state => {
      state.providerCredentials ||= [];
      const before = state.providerCredentials.length;
      state.providerCredentials = state.providerCredentials.filter(x => !(x.provider === 'meta' && x.tenantId === tenantId));
      const removed = before !== state.providerCredentials.length;
      if (removed) { state.auditEvents ||= []; state.auditEvents.push({ id: randomBytes(16).toString('hex'), tenantId, type: 'provider.meta.credentials.removed', at: new Date().toISOString() }); }
      return { removed };
    });
  }
  async list() {
    const state = await this.store.read();
    return (state.providerCredentials || []).filter(x => x.provider === 'meta').map(({ tenantId, adAccountId, currency, updatedAt }) => ({ tenantId, adAccountId, currency, updatedAt }));
  }
}
function encrypt(key, value) { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, iv); const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') }; }
function decrypt(key, record) { const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(record.iv, 'base64')); decipher.setAuthTag(Buffer.from(record.tag, 'base64')); return Buffer.concat([decipher.update(Buffer.from(record.ciphertext, 'base64')), decipher.final()]).toString('utf8'); }
function requireText(value, name, max) { const text = String(value || '').trim(); if (!text || text.length > max || /[\u0000-\u001f\u007f]/.test(text)) throw fault(`INVALID_${name.toUpperCase()}`, 400, `${name} is invalid.`); return text; }
function fault(code, status, message) { return Object.assign(new Error(message), { code, status }); }
