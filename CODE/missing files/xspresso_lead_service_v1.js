/**
 * Tenant-scoped lead capture service for the local Xspresso API.
 * Call only with the authenticated user returned by AuthService.
 * Records consent evidence; this is not, by itself, a legal-compliance guarantee.
 */
import { randomUUID } from 'node:crypto';

export class LeadService {
  constructor({ store, clock = () => Date.now() } = {}) {
    if (!store) throw new TypeError('LeadService requires a store.');
    this.store = store;
    this.clock = clock;
  }

  async capture(user, input = {}) {
    const tenantId = requireTenant(user);
    const email = normalizeEmail(input.email);
    if (input.consent !== true) {
      throw codedError('CONSENT_REQUIRED', 'Explicit consent is required before saving this lead.', 400);
    }
    const name = text(input.name, 120);
    const source = text(input.source, 120);
    const campaignId = input.campaignId == null ? null : text(input.campaignId, 80);
    const now = new Date(this.clock()).toISOString();
    const lead = {
      id: randomUUID(), tenantId, campaignId, email, name, source,
      status: 'new', tags: [], timeline: [],
      consent: { granted: true, grantedAt: now, textVersion: text(input.consentTextVersion, 40) || null },
      createdAt: now, updatedAt: now
    };

    return this.store.update(state => {
      state.leads ||= [];
      state.auditEvents ||= [];
      if (campaignId && !state.campaigns.some(c => c.id === campaignId && c.tenantId === tenantId)) {
        throw codedError('CAMPAIGN_NOT_FOUND', 'Campaign not found for this account.', 404);
      }
      const duplicate = state.leads.find(item => item.tenantId === tenantId && item.email === email && item.campaignId === campaignId);
      if (duplicate) return { lead: duplicate, created: false };
      lead.timeline.push({ id: randomUUID(), type: 'captured', at: now, source });
      state.leads.push(lead);
      state.auditEvents.push(audit(user, 'lead.captured', lead.id, now));
      return { lead, created: true };
    });
  }

  async list(user, { campaignId, status, limit = 50, cursor } = {}) {
    const tenantId = requireTenant(user);
    const boundedLimit = Math.max(1, Math.min(Number.isInteger(limit) ? limit : 50, 100));
    const state = await this.store.read();
    let rows = (state.leads || []).filter(lead => lead.tenantId === tenantId);
    if (campaignId) rows = rows.filter(lead => lead.campaignId === campaignId);
    if (status) rows = rows.filter(lead => lead.status === status);
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    if (cursor) {
      const index = rows.findIndex(row => row.id === cursor);
      if (index >= 0) rows = rows.slice(index + 1);
    }
    const page = rows.slice(0, boundedLimit);
    return { leads: page, nextCursor: rows.length > boundedLimit ? page.at(-1)?.id || null : null };
  }

  async addTimelineEvent(user, leadId, { type, note = '' } = {}) {
    const tenantId = requireTenant(user);
    const allowed = new Set(['email_sent', 'email_opened', 'link_clicked', 'replied', 'purchased', 'note']);
    if (!allowed.has(type)) throw codedError('INVALID_EVENT', 'Unsupported lead activity type.', 400);
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      const lead = (state.leads || []).find(row => row.id === leadId && row.tenantId === tenantId);
      if (!lead) throw codedError('LEAD_NOT_FOUND', 'Lead not found.', 404);
      const event = { id: randomUUID(), type, note: text(note, 500), at: now };
      lead.timeline ||= [];
      lead.timeline.push(event);
      lead.updatedAt = now;
      if (type === 'purchased') lead.status = 'customer';
      state.auditEvents ||= [];
      state.auditEvents.push(audit(user, `lead.${type}`, lead.id, now));
      return { lead, event };
    });
  }

  async updateStatus(user, leadId, status) {
    const tenantId = requireTenant(user);
    const allowed = new Set(['new', 'contacted', 'qualified', 'customer', 'unsubscribed', 'archived']);
    if (!allowed.has(status)) throw codedError('INVALID_STATUS', 'Unsupported lead status.', 400);
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      const lead = (state.leads || []).find(row => row.id === leadId && row.tenantId === tenantId);
      if (!lead) throw codedError('LEAD_NOT_FOUND', 'Lead not found.', 404);
      lead.status = status;
      lead.updatedAt = now;
      return lead;
    });
  }
}

function requireTenant(user) {
  if (!user?.id || !user?.tenantId) throw codedError('UNAUTHENTICATED', 'Authenticated user required.', 401);
  return user.tenantId;
}
function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw codedError('INVALID_EMAIL', 'Enter a valid email address.', 400);
  return email;
}
function text(value, max) { return String(value ?? '').trim().slice(0, max); }
function codedError(code, message, status) { return Object.assign(new Error(message), { code, status }); }
function audit(user, action, resourceId, createdAt) {
  return { id: randomUUID(), tenantId: user.tenantId, actorId: user.id, action,
    resourceType: 'lead', resourceId, outcome: 'success', createdAt };
}
