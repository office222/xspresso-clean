import { randomUUID } from 'node:crypto';

/** Creates consent-gated, campaign-specific follow-up schedules in the store. */
export class FollowupSequenceService {
  constructor({ store, clock = () => Date.now() } = {}) {
    if (!store) throw new TypeError('store is required.');
    this.store = store;
    this.clock = clock;
  }

  async enroll({ user, leadId, campaignId, idempotencyKey } = {}) {
    const tenantId = requireTenant(user);
    const key = String(idempotencyKey || '').trim();
    if (key.length < 8 || key.length > 160) throw fault('IDEMPOTENCY_KEY_REQUIRED', 'An idempotency key of 8–160 characters is required.', 400);

    return this.store.update(state => {
      state.leads ||= [];
      state.campaigns ||= [];
      state.followupEnrollments ||= [];
      const lead = state.leads.find(row => row.id === leadId && row.tenantId === tenantId);
      if (!lead) throw fault('LEAD_NOT_FOUND', 'Lead not found.', 404);
      if (lead.optedOutAt || lead.status === 'unsubscribed') throw fault('LEAD_OPTED_OUT', 'This lead has opted out of follow-up.', 409);
      if (lead.consent !== true && !lead.consentGrantedAt) throw fault('CONSENT_REQUIRED', 'Recorded consent is required before follow-up.', 409);
      if (!lead.email) throw fault('LEAD_EMAIL_REQUIRED', 'The lead needs a valid email address.', 409);

      const campaign = state.campaigns.find(row => row.id === campaignId && row.tenantId === tenantId);
      if (!campaign) throw fault('CAMPAIGN_NOT_FOUND', 'Campaign not found.', 404);
      const messages = campaign.assets?.generatedDraft?.followUpEmails;
      if (!Array.isArray(messages) || messages.length === 0) throw fault('FOLLOWUP_NOT_CONFIGURED', 'This campaign has no follow-up messages.', 409);

      const prior = state.followupEnrollments.find(row => row.tenantId === tenantId && row.idempotencyKey === key);
      if (prior) return prior;
      const duplicate = state.followupEnrollments.find(row => row.tenantId === tenantId && row.leadId === leadId && row.campaignId === campaignId && row.status === 'active');
      if (duplicate) return duplicate;

      const now = this.clock();
      const enrollment = {
        id: randomUUID(), tenantId, leadId, campaignId, idempotencyKey: key, status: 'active',
        createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
        messages: messages.map((message, index) => {
          const delayDays = Number.isInteger(message.delayDays) && message.delayDays >= 0 ? message.delayDays : index;
          return {
            id: randomUUID(), sequence: index + 1, subject: String(message.subject || '').slice(0, 180),
            body: String(message.body || '').slice(0, 5000), delayDays,
            dueAt: new Date(now + delayDays * 86_400_000).toISOString(), status: 'scheduled', attempts: 0
          };
        })
      };
      state.followupEnrollments.push(enrollment);
      state.auditEvents ||= [];
      state.auditEvents.push({ id: randomUUID(), tenantId, actorId: user.id, action: 'lead.followup_enrolled', resourceType: 'lead', resourceId: leadId, createdAt: enrollment.createdAt });
      return enrollment;
    });
  }

  async optOut({ user, leadId } = {}) {
    const tenantId = requireTenant(user);
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      state.leads ||= [];
      const lead = state.leads.find(row => row.id === leadId && row.tenantId === tenantId);
      if (!lead) throw fault('LEAD_NOT_FOUND', 'Lead not found.', 404);
      lead.optedOutAt ||= now;
      lead.status = 'unsubscribed';
      for (const enrollment of state.followupEnrollments || []) {
        if (enrollment.tenantId === tenantId && enrollment.leadId === leadId && enrollment.status === 'active') {
          enrollment.status = 'opted_out'; enrollment.updatedAt = now;
          for (const message of enrollment.messages || []) if (message.status === 'scheduled') message.status = 'cancelled';
        }
      }
      return { leadId, status: 'unsubscribed', optedOutAt: lead.optedOutAt };
    });
  }
}

function requireTenant(user) {
  if (!user?.id || !user?.tenantId) throw fault('UNAUTHENTICATED', 'Authenticated user required.', 401);
  return user.tenantId;
}
function fault(code, message, status) { return Object.assign(new Error(message), { code, status }); }
