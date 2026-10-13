import { randomUUID } from 'node:crypto';

/**
 * Consent-checking follow-up worker that appends a signed unsubscribe link.
 * Mailer adapters should honor idempotencyKey to avoid duplicate sends on retry.
 */
export class FollowupDeliveryWorker {
  constructor({ store, mailer, unsubscribeTokens, publicBaseUrl, clock = () => Date.now(), maxAttempts = 5, leaseMs = 60_000 } = {}) {
    if (!store || typeof mailer?.send !== 'function' || typeof unsubscribeTokens?.issue !== 'function') {
      throw new TypeError('store, mailer.send, and unsubscribeTokens.issue are required.');
    }
    let base;
    try { base = new URL(publicBaseUrl); } catch { throw new TypeError('publicBaseUrl must be an absolute HTTP(S) URL.'); }
    if (!['http:', 'https:'].includes(base.protocol)) throw new TypeError('publicBaseUrl must use HTTP or HTTPS.');
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || !Number.isInteger(leaseMs) || leaseMs < 1000) throw new TypeError('Invalid retry or lease settings.');
    this.store = store; this.mailer = mailer; this.unsubscribeTokens = unsubscribeTokens;
    this.unsubscribeUrl = new URL('/api/unsubscribe', base).toString();
    this.clock = clock; this.maxAttempts = maxAttempts; this.leaseMs = leaseMs;
  }

  async runOne() {
    const nowMs = this.clock();
    const leaseId = randomUUID();
    const claim = await this.store.update(state => {
      state.followupEnrollments ||= []; state.leads ||= [];
      for (const enrollment of state.followupEnrollments) {
        if (enrollment.status !== 'active') continue;
        const lead = state.leads.find(row => row.id === enrollment.leadId && row.tenantId === enrollment.tenantId);
        const consented = lead?.consent === true || Boolean(lead?.consentGrantedAt);
        if (!lead || !consented || lead.optedOutAt || lead.status === 'unsubscribed' || !lead.email) {
          enrollment.status = lead?.optedOutAt || lead?.status === 'unsubscribed' ? 'opted_out' : 'blocked';
          for (const message of enrollment.messages || []) if (message.status === 'scheduled') message.status = 'cancelled';
          continue;
        }
        for (const message of enrollment.messages || []) {
          const due = Number.isFinite(Date.parse(message.dueAt)) && Date.parse(message.dueAt) <= nowMs;
          const staleLease = message.status === 'sending' && Number.isFinite(Date.parse(message.leaseUntil)) && Date.parse(message.leaseUntil) <= nowMs;
          if ((message.status !== 'scheduled' && !staleLease) || !due) continue;
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
      const token = this.unsubscribeTokens.issue({ tenantId: claim.tenantId, leadId: claim.leadId });
      const link = new URL(this.unsubscribeUrl);
      link.searchParams.set('token', token);
      const text = `${claim.text}\n\nTo stop receiving these follow-up messages, visit: ${link.toString()}`;
      const delivery = await this.mailer.send({
        to: claim.to, subject: claim.subject, text, tenantId: claim.tenantId, leadId: claim.leadId,
        unsubscribeUrl: link.toString(), idempotencyKey: `xspresso-followup-${claim.messageId}`
      });
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
        else { message.status = 'scheduled'; message.dueAt = new Date(this.clock() + Math.min(3_600_000, 30_000 * (2 ** (message.attempts - 1)))).toISOString(); }
        enrollment.updatedAt = failedAt;
      });
      return { sent: false, messageId: claim.messageId, retryable: true, errorCode: error?.code || 'DELIVERY_FAILED' };
    }
  }
}
