import { randomUUID } from 'node:crypto';

/** Applies a signed unsubscribe request and cancels not-yet-sent follow-ups. */
export class UnsubscribeService {
  constructor({ store, tokenService, clock = () => Date.now() } = {}) {
    if (!store || typeof tokenService?.verify !== 'function') throw new TypeError('store and tokenService.verify are required.');
    this.store = store;
    this.tokenService = tokenService;
    this.clock = clock;
  }

  async unsubscribe(token) {
    const claims = this.tokenService.verify(token);
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      state.leads ||= [];
      state.followupEnrollments ||= [];
      const lead = state.leads.find(row => row.id === claims.leadId && row.tenantId === claims.tenantId);
      // A valid signed token must not disclose whether a particular lead exists.
      if (!lead) return { unsubscribed: true, alreadyUnsubscribed: true };
      const alreadyUnsubscribed = Boolean(lead.optedOutAt) || lead.status === 'unsubscribed';
      lead.optedOutAt ||= now;
      lead.status = 'unsubscribed';
      lead.consent = false;
      lead.updatedAt = now;
      for (const enrollment of state.followupEnrollments) {
        if (enrollment.tenantId !== claims.tenantId || enrollment.leadId !== claims.leadId) continue;
        if (enrollment.status === 'active') enrollment.status = 'opted_out';
        enrollment.updatedAt = now;
        for (const message of enrollment.messages || []) {
          if (message.status === 'scheduled' || message.status === 'sending') {
            message.status = 'cancelled';
            delete message.leaseId;
            delete message.leaseUntil;
          }
        }
      }
      state.auditEvents ||= [];
      state.auditEvents.push({ id: randomUUID(), tenantId: claims.tenantId, actorId: null, action: 'lead.unsubscribed', resourceType: 'lead', resourceId: claims.leadId, createdAt: now });
      return { unsubscribed: true, alreadyUnsubscribed, leadId: claims.leadId, completedAt: now };
    });
  }
}
