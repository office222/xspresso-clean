import { randomUUID } from 'node:crypto';

/**
 * Delivers due follow-up messages through an injected mailer adapter.
 * For safe retries, the adapter should honor the supplied idempotencyKey.
 */
export class FollowupDeliveryWorker {
  constructor({ store, mailer, clock = () => Date.now(), maxAttempts = 5, leaseMs = 60_000 } = {}) {
    if (!store || typeof mailer?.send !== 'function') throw new TypeError('store and mailer.send are required.');
    this.store = store; this.mailer = mailer; this.clock = clock; this.maxAttempts = maxAttempts; this.leaseMs = leaseMs;
  }

  async runOne() {
    const nowMs = this.clock();
    const leaseId = randomUUID();
    const claim = await this.store.update(state => {
      state.followupEnrollments ||= [];
      state.leads ||= [];
      for (const enrollment of state.followupEnrollments) {
        if (enrollment.status !== 'active') continue;
        const lead = state.leads.find(row => row.id === enrollment.leadId && row.tenantId === enrollment.tenantId);
        if (!lead || lead.optedOutAt || lead.status === 'unsubscribed' || (!lead.email)) {
          enrollment.status = lead?.optedOutAt || lead?.status === 'unsubscribed' ? 'opted_out' : 'blocked';
          for (const message of enrollment.messages || []) if (message.status === 'scheduled') message.status = 'cancelled';
          continue;
        }
        for (const message of enrollment.messages || []) {
          const due = Date.parse(message.dueAt) <= nowMs;
          const stale = message.status === 'sending' && Date.parse(message.leaseUntil || 0) <= nowMs;
          if ((message.status !== 'scheduled' && !stale) || !due) continue;
          if (message.attempts >= this.maxAttempts) { message.status = 'failed'; continue; }
          message.status = 'sending'; message.attempts += 1; message.leaseId = leaseId;
          message.leaseUntil = new Date(nowMs + this.leaseMs).toISOString();
          return { enrollmentId: enrollment.id, messageId: message.id, leaseId, tenantId: enrollment.tenantId, leadId: lead.id, to: lead.email, subject: message.subject, text: message.body };
        }
      }
      return null;
    });
    if (!claim) return { sent: false, reason: 'nothing_due' };

    try {
      const delivery = await this.mailer.send({ to: claim.to, subject: claim.subject, text: claim.text, idempotencyKey: `xspresso-followup-${claim.messageId}` });
      const sentAt = new Date(this.clock()).toISOString();
      await this.store.update(state => {
        const enrollment = (state.followupEnrollments || []).find(row => row.id === claim.enrollmentId && row.tenantId === claim.tenantId);
        const message = enrollment?.messages?.find(row => row.id === claim.messageId && row.leaseId === claim.leaseId);
        if (!message) return;
        message.status = 'sent'; message.sentAt = sentAt; message.providerMessageId = String(delivery?.id || '').slice(0, 200) || null;
        delete message.leaseId; delete message.leaseUntil; enrollment.updatedAt = sentAt;
      });
      return { sent: true, messageId: claim.messageId, sentAt };
    } catch (error) {
      const failedAt = new Date(this.clock()).toISOString();
      await this.store.update(state => {
        const enrollment = (state.followupEnrollments || []).find(row => row.id === claim.enrollmentId && row.tenantId === claim.tenantId);
        const message = enrollment?.messages?.find(row => row.id === claim.messageId && row.leaseId === claim.leaseId);
        if (!message) return;
        message.lastError = String(error?.code || 'DELIVERY_FAILED').slice(0, 80);
        delete message.leaseId; delete message.leaseUntil;
        if (message.attempts >= this.maxAttempts) message.status = 'failed';
        else {
          message.status = 'scheduled';
          const backoffMs = Math.min(3_600_000, 30_000 * (2 ** (message.attempts - 1)));
          message.dueAt = new Date(this.clock() + backoffMs).toISOString();
        }
        enrollment.updatedAt = failedAt;
      });
      return { sent: false, messageId: claim.messageId, retryable: true, errorCode: error?.code || 'DELIVERY_FAILED' };
    }
  }
}
