/**
 * Append-only audit log service (ES module; no external dependencies).
 * Inject a durable adapter in production. Never put passwords, access tokens,
 * payment data, or other secrets in audit metadata.
 */

const SENSITIVE_KEY = /(password|secret|token|authorization|cookie|api.?key|card|cvv)/i;

export class MemoryAuditAdapter {
  constructor() { this.entries = []; }
  async append(entry) { this.entries.push(copy(entry)); return copy(entry); }
  async query({ tenantId, actorId, action, resourceType, resourceId, from, to, limit = 100 } = {}) {
    const start = from ? new Date(from).getTime() : -Infinity;
    const end = to ? new Date(to).getTime() : Infinity;
    return this.entries.filter(entry =>
      (!tenantId || entry.tenantId === tenantId) && (!actorId || entry.actorId === actorId) &&
      (!action || entry.action === action) && (!resourceType || entry.resourceType === resourceType) &&
      (!resourceId || entry.resourceId === resourceId) &&
      new Date(entry.createdAt).getTime() >= start && new Date(entry.createdAt).getTime() <= end
    ).slice(-Math.max(1, Math.min(Number(limit) || 100, 1000))).reverse().map(copy);
  }
}

export class AuditLog {
  constructor({ adapter = new MemoryAuditAdapter(), clock = () => new Date(), idFactory = defaultId } = {}) {
    this.adapter = adapter; this.clock = clock; this.idFactory = idFactory;
  }
  async record({ tenantId, actorId = null, action, resourceType, resourceId = null,
    outcome = 'success', requestId = null, ip = null, userAgent = null, metadata = {} }) {
    if (!String(tenantId || '').trim()) throw new TypeError('tenantId is required.');
    if (!String(action || '').trim()) throw new TypeError('action is required.');
    if (!String(resourceType || '').trim()) throw new TypeError('resourceType is required.');
    if (!['success', 'failure', 'denied'].includes(outcome)) throw new TypeError('Invalid audit outcome.');
    const entry = Object.freeze({ id: this.idFactory(), tenantId, actorId, action, resourceType,
      resourceId, outcome, requestId, ip, userAgent, metadata: sanitize(metadata),
      createdAt: this.clock().toISOString() });
    return this.adapter.append(entry);
  }
  query(filters = {}) {
    return this.adapter.query(filters);
  }
}

export function sanitize(value, depth = 0) {
  if (depth > 8) return '[max-depth]';
  if (Array.isArray(value)) return value.slice(0, 100).map(item => sanitize(item, depth + 1));
  if (value && typeof value === 'object') {
    const result = {};
    for (const [key, item] of Object.entries(value).slice(0, 100)) {
      result[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : sanitize(item, depth + 1);
    }
    return result;
  }
  if (typeof value === 'string') return value.slice(0, 2000);
  if (value === null || ['number', 'boolean'].includes(typeof value)) return value;
  return String(value).slice(0, 2000);
}

function defaultId() { return globalThis.crypto?.randomUUID?.() || `audit_${Date.now()}_${Math.random().toString(36).slice(2)}`; }
function copy(value) { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
