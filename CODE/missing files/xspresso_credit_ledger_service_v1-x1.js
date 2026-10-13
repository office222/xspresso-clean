import { randomUUID } from 'node:crypto';

const MAX_CREDITS = 1_000_000_000;
const MAX_IDEMPOTENCY_LENGTH = 512;

/** Append-only tenant credit ledger. Granting credits is restricted to local/admin code. */
export class CreditLedgerService {
  constructor({ store, clock = () => Date.now() } = {}) {
    if (!store || typeof store.read !== 'function' || typeof store.update !== 'function') throw new TypeError('A compatible store is required.');
    this.store = store;
    this.clock = clock;
  }

  async post(input = {}) {
    const tenantId = required(input.tenantId, 'tenantId', 120);
    const actorId = required(input.actorId, 'actorId', 120);
    const kind = input.kind;
    if (!['grant', 'debit', 'refund'].includes(kind)) throw fault('INVALID_CREDIT_KIND', 'Credit operation must be grant, debit, or refund.', 400);
    if (kind === 'grant' && input.actorRole !== 'admin') throw fault('FORBIDDEN', 'Only an administrator may grant credits.', 403);
    const credits = input.credits;
    if (!Number.isSafeInteger(credits) || credits <= 0 || credits > MAX_CREDITS) throw fault('INVALID_CREDIT_AMOUNT', `credits must be an integer from 1 to ${MAX_CREDITS}.`, 400);
    const idempotencyKey = required(input.idempotencyKey, 'idempotencyKey', MAX_IDEMPOTENCY_LENGTH);
    const reason = required(input.reason, 'reason', 240);
    const referenceId = input.referenceId == null ? null : required(input.referenceId, 'referenceId', 160);
    const now = new Date(this.clock()).toISOString();

    return this.store.update(state => {
      state.creditLedger ||= [];
      const duplicate = state.creditLedger.find(row => row.tenantId === tenantId && row.idempotencyKey === idempotencyKey);
      if (duplicate) return { entry: duplicate, balance: balanceFor(state.creditLedger, tenantId), duplicate: true };
      const currentBalance = balanceFor(state.creditLedger, tenantId);
      if (kind === 'debit' && credits > currentBalance) throw fault('INSUFFICIENT_CREDITS', 'Not enough credits to complete this action.', 402);
      const entry = {
        id: randomUUID(), tenantId, actorId, kind, credits,
        reason, referenceId, idempotencyKey, createdAt: now
      };
      state.creditLedger.push(entry);
      state.auditEvents ||= [];
      state.auditEvents.push({
        id: randomUUID(), tenantId, actorId,
        action: `credits.${kind}`, resourceType: 'credit_ledger', resourceId: entry.id,
        amount: credits, referenceId, createdAt: now
      });
      return { entry, balance: balanceFor(state.creditLedger, tenantId), duplicate: false };
    });
  }

  async getBalance(tenantId) {
    const id = required(tenantId, 'tenantId', 120);
    const state = await this.store.read();
    const entries = (state.creditLedger || []).filter(row => row.tenantId === id);
    return { balance: balanceFor(entries, id), entries: entries.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 100) };
  }
}

export function balanceFor(entries, tenantId) {
  const balance = entries.filter(row => row.tenantId === tenantId).reduce((sum, row) => {
    if (!Number.isSafeInteger(row.credits) || row.credits < 0) return sum;
    return sum + (row.kind === 'debit' ? -row.credits : row.credits);
  }, 0);
  return Math.max(0, balance);
}
function required(value, field, max) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw fault('INVALID_CREDIT_ENTRY', `${field} must be a non-empty string of at most ${max} characters.`, 400);
  return value.trim();
}
function fault(code, message, status) { return Object.assign(new Error(message), { code, status }); }
