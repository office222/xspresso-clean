/**
 * Append-only, idempotent credit ledger backed by JsonStore.
 * Keep prices and credit grants server-controlled; never trust amounts from a browser.
 */
import { randomUUID } from 'node:crypto';

const POSITIVE_KINDS = new Set(['grant', 'purchase', 'refund']);
const NEGATIVE_KINDS = new Set(['debit', 'expiration']);

export class CreditLedgerService {
  constructor({ store, clock = () => Date.now() } = {}) {
    if (!store) throw new TypeError('CreditLedgerService requires a store.');
    this.store = store;
    this.clock = clock;
  }

  async post({ tenantId, actorId = null, kind, credits, reason, referenceId = null, idempotencyKey }) {
    if (!tenantId) throw error('TENANT_REQUIRED', 'Tenant is required.', 400);
    if (!POSITIVE_KINDS.has(kind) && !NEGATIVE_KINDS.has(kind)) throw error('INVALID_KIND', 'Unsupported ledger entry kind.', 400);
    if (!Number.isSafeInteger(credits) || credits <= 0) throw error('INVALID_CREDITS', 'Credits must be a positive integer.', 400);
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 8 || idempotencyKey.length > 160) {
      throw error('IDEMPOTENCY_KEY_REQUIRED', 'Provide a stable idempotency key.', 400);
    }
    const delta = POSITIVE_KINDS.has(kind) ? credits : -credits;
    const now = new Date(this.clock()).toISOString();

    return this.store.update(state => {
      state.creditLedger ||= [];
      state.auditEvents ||= [];
      const prior = state.creditLedger.find(row => row.tenantId === tenantId && row.idempotencyKey === idempotencyKey);
      if (prior) return { entry: prior, duplicate: true, balance: balanceOf(state.creditLedger, tenantId) };
      const balance = balanceOf(state.creditLedger, tenantId);
      if (delta < 0 && balance + delta < 0) throw error('INSUFFICIENT_CREDITS', 'This action would exceed the available credit balance.', 409);

      const entry = {
        id: randomUUID(), tenantId, actorId, kind, credits, delta,
        reason: cleanText(reason, 180), referenceId: referenceId ? cleanText(referenceId, 120) : null,
        idempotencyKey: idempotencyKey.trim(), createdAt: now
      };
      state.creditLedger.push(entry);
      if (actorId) state.auditEvents.push({ id: randomUUID(), tenantId, actorId,
        action: `credits.${kind}`, resourceType: 'credit_ledger', resourceId: entry.id,
        outcome: 'success', createdAt: now });
      return { entry, duplicate: false, balance: balance + delta };
    });
  }

  async balance(tenantId) {
    if (!tenantId) throw error('TENANT_REQUIRED', 'Tenant is required.', 400);
    const state = await this.store.read();
    const entries = (state.creditLedger || []).filter(row => row.tenantId === tenantId);
    return { tenantId, balance: balanceOf(entries, tenantId), entries: entries.length };
  }

  async list(tenantId, { limit = 50, before } = {}) {
    if (!tenantId) throw error('TENANT_REQUIRED', 'Tenant is required.', 400);
    const state = await this.store.read();
    let rows = (state.creditLedger || []).filter(row => row.tenantId === tenantId);
    if (before) rows = rows.filter(row => row.createdAt < before);
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    return rows.slice(0, Math.max(1, Math.min(Number.isInteger(limit) ? limit : 50, 100)));
  }
}

function balanceOf(entries, tenantId) {
  return entries.filter(row => row.tenantId === tenantId).reduce((sum, row) => sum + row.delta, 0);
}
function cleanText(value, max) { return String(value ?? '').trim().slice(0, max); }
function error(code, message, status) { return Object.assign(new Error(message), { code, status }); }
