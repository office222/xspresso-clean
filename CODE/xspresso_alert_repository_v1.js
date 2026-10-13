import { randomUUID } from 'node:crypto';

/** Tenant-scoped alert persistence with deterministic deduplication keys. */
export class AlertRepository {
  constructor({ store, clock = () => Date.now() } = {}) {
    if (!store) throw new TypeError('store is required.');
    this.store = store; this.clock = clock;
  }

  async createOrRefresh(input) {
    const { tenantId, campaignId, type, severity, title, message, recommendation = '', adId = null } = input || {};
    if (!tenantId || !campaignId || !type || !['info', 'warning', 'critical'].includes(severity)) throw new TypeError('tenantId, campaignId, type, and valid severity are required.');
    const windowKey = String(input.windowKey || new Date(this.clock()).toISOString().slice(0, 10));
    const dedupeKey = [tenantId, campaignId, adId || '-', type, windowKey].join(':');
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      state.alerts ||= [];
      const existing = state.alerts.find(row => row.dedupeKey === dedupeKey && row.status !== 'resolved');
      if (existing) {
        existing.title = String(title).slice(0, 160); existing.message = String(message).slice(0, 1000);
        existing.recommendation = String(recommendation).slice(0, 500); existing.severity = severity;
        existing.updatedAt = now; existing.occurrences = (existing.occurrences || 1) + 1;
        return existing;
      }
      const alert = {
        id: randomUUID(), tenantId, campaignId, adId, type, severity, title: String(title).slice(0, 160),
        message: String(message).slice(0, 1000), recommendation: String(recommendation).slice(0, 500),
        dedupeKey, status: 'open', occurrences: 1, createdAt: now, updatedAt: now
      };
      state.alerts.push(alert);
      return alert;
    });
  }

  async list({ tenantId, status, limit = 50 } = {}) {
    if (!tenantId) throw new TypeError('tenantId is required.');
    const state = await this.store.read();
    const safeLimit = Math.max(1, Math.min(200, Number.isInteger(limit) ? limit : 50));
    return (state.alerts || []).filter(row => row.tenantId === tenantId && (!status || row.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, safeLimit);
  }

  async resolve({ tenantId, alertId, actorId } = {}) {
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      const alert = (state.alerts || []).find(row => row.id === alertId && row.tenantId === tenantId);
      if (!alert) throw Object.assign(new Error('Alert not found.'), { code: 'ALERT_NOT_FOUND', status: 404 });
      alert.status = 'resolved'; alert.resolvedAt = now; alert.resolvedBy = actorId || null; alert.updatedAt = now;
      return alert;
    });
  }
}
