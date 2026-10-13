/**
 * Server-side signed webhook delivery queue (Node.js ES module).
 * Requires Node 18+ for fetch and node:crypto. Keep signing secrets server-side.
 * Retries are explicit via runDue(); persist the queue adapter in production.
 */
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

const ALLOWED_EVENTS = new Set([
  'campaign.created', 'campaign.launched', 'campaign.paused', 'campaign.performance.warning',
  'lead.created', 'credits.low', 'integration.disconnected'
]);
const PRIVATE_HOSTS = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[::1\])/i;

export class MemoryWebhookStore {
  constructor() { this.endpoints = new Map(); this.deliveries = new Map(); }
  async saveEndpoint(endpoint) { this.endpoints.set(endpoint.id, structuredClone(endpoint)); return publicEndpoint(endpoint); }
  async listEndpoints(tenantId) { return [...this.endpoints.values()].filter(e => e.tenantId === tenantId).map(publicEndpoint); }
  async getEndpoint(id) { return structuredClone(this.endpoints.get(id) || null); }
  async saveDelivery(delivery) { this.deliveries.set(delivery.id, structuredClone(delivery)); return structuredClone(delivery); }
  async dueDeliveries(now) { return [...this.deliveries.values()].filter(d => ['pending','retry'].includes(d.status) && new Date(d.nextAttemptAt) <= now).map(d => structuredClone(d)); }
}

export class WebhookService {
  constructor({ store = new MemoryWebhookStore(), fetchImpl = globalThis.fetch, clock = () => new Date(), maxAttempts = 5,
    allowPrivateHosts = false } = {}) {
    if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required.');
    this.store = store; this.fetch = fetchImpl; this.clock = clock; this.maxAttempts = maxAttempts; this.allowPrivateHosts = allowPrivateHosts;
  }
  async registerEndpoint({ tenantId, url, events, secret, description = '' }) {
    validateHttpsUrl(url, this.allowPrivateHosts);
    if (!String(tenantId || '').trim()) throw new TypeError('tenantId is required.');
    if (!String(secret || '').trim()) throw new TypeError('Signing secret is required.');
    const subscriptions = [...new Set(events || [])];
    if (!subscriptions.length || subscriptions.some(event => !ALLOWED_EVENTS.has(event))) throw new TypeError('Choose supported webhook events.');
    const endpoint = { id: randomUUID(), tenantId, url, events: subscriptions, secret,
      description: String(description).slice(0, 300), active: true, createdAt: this.clock().toISOString() };
    return this.store.saveEndpoint(endpoint);
  }
  async removeEndpoint({ tenantId, endpointId }) {
    const endpoint = await this.store.getEndpoint(endpointId);
    if (!endpoint || endpoint.tenantId !== tenantId) return false;
    endpoint.active = false; endpoint.secret = null; endpoint.deletedAt = this.clock().toISOString();
    await this.store.saveEndpoint(endpoint); return true;
  }
  async enqueue({ tenantId, event, payload }) {
    if (!ALLOWED_EVENTS.has(event)) throw new TypeError('Unsupported webhook event.');
    const endpoints = (await this.store.listEndpoints(tenantId)).filter(e => e.active && e.events.includes(event));
    const now = this.clock();
    const jobs = [];
    for (const safe of endpoints) {
      const full = await this.store.getEndpoint(safe.id);
      const job = { id: randomUUID(), tenantId, endpointId: full.id, event,
        payload: structuredClone(payload), status: 'pending', attempts: 0,
        createdAt: now.toISOString(), nextAttemptAt: now.toISOString(), lastStatusCode: null, lastError: null };
      await this.store.saveDelivery(job); jobs.push(job);
    }
    return jobs;
  }
  async runDue() {
    const now = this.clock(); const jobs = await this.store.dueDeliveries(now); const results = [];
    for (const job of jobs) results.push(await this.#deliver(job));
    return results;
  }
  async #deliver(job) {
    const endpoint = await this.store.getEndpoint(job.endpointId);
    if (!endpoint?.active || !endpoint.secret) {
      job.status = 'failed'; job.lastError = 'Endpoint is inactive or has no signing secret.';
      await this.store.saveDelivery(job); return job;
    }
    validateHttpsUrl(endpoint.url, this.allowPrivateHosts);
    const body = JSON.stringify({ id: job.id, type: job.event, createdAt: job.createdAt, data: job.payload });
    const signature = createHmac('sha256', endpoint.secret).update(body).digest('hex');
    job.attempts += 1;
    try {
      const response = await this.fetch(endpoint.url, { method: 'POST', redirect: 'error',
        headers: { 'content-type': 'application/json', 'x-xspresso-event': job.event,
          'x-xspresso-delivery': job.id, 'x-xspresso-signature': `sha256=${signature}` },
        body, signal: AbortSignal.timeout(10000) });
      job.lastStatusCode = response.status;
      if (response.ok) { job.status = 'delivered'; job.deliveredAt = this.clock().toISOString(); job.lastError = null; }
      else this.#scheduleFailure(job, `Receiver returned HTTP ${response.status}.`);
    } catch (error) { this.#scheduleFailure(job, String(error?.message || 'Network error.').slice(0, 300)); }
    await this.store.saveDelivery(job); return job;
  }
  #scheduleFailure(job, message) {
    job.lastError = message;
    if (job.attempts >= this.maxAttempts) { job.status = 'failed'; return; }
    const delayMs = Math.min(60 * 60 * 1000, 1000 * 2 ** (job.attempts - 1));
    job.status = 'retry'; job.nextAttemptAt = new Date(this.clock().getTime() + delayMs).toISOString();
  }
}

export function verifyWebhookSignature({ rawBody, secret, signature }) {
  const supplied = String(signature || '').replace(/^sha256=/, '');
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(supplied, 'hex'));
}
function validateHttpsUrl(value, allowPrivateHosts) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new TypeError('Webhook destinations must use HTTPS.');
  if (url.username || url.password) throw new TypeError('Webhook URL must not contain credentials.');
  if (!allowPrivateHosts && PRIVATE_HOSTS.test(url.hostname)) throw new TypeError('Private/local webhook destinations are blocked.');
}
function publicEndpoint(endpoint) { const { secret, ...safe } = endpoint; return { ...safe, hasSecret: Boolean(secret) }; }
