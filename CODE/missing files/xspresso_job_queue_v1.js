/**
 * Single-process persistent job queue for deferred campaign, monitoring, email,
 * or webhook work. JsonStore serializes updates only within one process; use a
 * dedicated queue/database with distributed locks before running multiple workers.
 */
import { randomUUID } from 'node:crypto';

const TERMINAL = new Set(['succeeded', 'dead']);

export class JobQueue {
  constructor({ store, clock = () => Date.now(), leaseMs = 60_000, maxAttempts = 5 } = {}) {
    if (!store) throw new TypeError('JobQueue requires a store.');
    if (!Number.isSafeInteger(leaseMs) || leaseMs < 1000) throw new RangeError('leaseMs must be at least 1000.');
    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) throw new RangeError('maxAttempts must be positive.');
    this.store = store; this.clock = clock; this.leaseMs = leaseMs; this.maxAttempts = maxAttempts;
  }

  async enqueue({ tenantId, type, payload = {}, idempotencyKey, availableAt } = {}) {
    if (!tenantId || typeof type !== 'string' || !/^[a-z][a-z0-9_.-]{1,79}$/.test(type)) throw error('INVALID_JOB', 'Tenant and valid job type are required.', 400);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw error('INVALID_PAYLOAD', 'Job payload must be an object.', 400);
    if (idempotencyKey && (typeof idempotencyKey !== 'string' || idempotencyKey.length > 160)) throw error('INVALID_IDEMPOTENCY_KEY', 'Idempotency key is invalid.', 400);
    const now = this.clock();
    const runAt = availableAt == null ? now : new Date(availableAt).getTime();
    if (!Number.isFinite(runAt)) throw error('INVALID_RUN_AT', 'availableAt must be a valid date.', 400);
    return this.store.update(state => {
      state.jobs ||= [];
      if (idempotencyKey) {
        const prior = state.jobs.find(job => job.tenantId === tenantId && job.idempotencyKey === idempotencyKey);
        if (prior) return { job: prior, duplicate: true };
      }
      const job = { id: randomUUID(), tenantId, type, payload: structuredClone(payload),
        status: runAt > now ? 'scheduled' : 'queued', attempts: 0, maxAttempts: this.maxAttempts,
        idempotencyKey: idempotencyKey || null, availableAt: new Date(runAt).toISOString(),
        createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
        leaseOwner: null, leaseUntil: null, lastError: null };
      state.jobs.push(job);
      return { job, duplicate: false };
    });
  }

  async claimNext(workerId) {
    if (typeof workerId !== 'string' || !workerId.trim()) throw error('WORKER_REQUIRED', 'Worker id is required.', 400);
    const now = this.clock(), nowIso = new Date(now).toISOString();
    return this.store.update(state => {
      state.jobs ||= [];
      for (const job of state.jobs) {
        if (job.status === 'running' && Date.parse(job.leaseUntil || '') <= now) {
          job.status = job.attempts >= job.maxAttempts ? 'dead' : 'queued';
          job.leaseOwner = null; job.leaseUntil = null; job.updatedAt = nowIso;
        }
        if (job.status === 'scheduled' && Date.parse(job.availableAt) <= now) job.status = 'queued';
      }
      const job = state.jobs.filter(row => row.status === 'queued' && Date.parse(row.availableAt) <= now)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (!job) return null;
      job.status = 'running'; job.attempts += 1; job.leaseOwner = workerId;
      job.leaseUntil = new Date(now + this.leaseMs).toISOString(); job.updatedAt = nowIso;
      return job;
    });
  }

  async succeed(jobId, workerId, result = null) {
    return this.#finish(jobId, workerId, job => {
      job.status = 'succeeded'; job.result = result == null ? null : structuredClone(result);
      job.finishedAt = new Date(this.clock()).toISOString(); job.lastError = null;
    });
  }

  async fail(jobId, workerId, reason) {
    return this.#finish(jobId, workerId, job => {
      job.lastError = String(reason || 'Job failed.').slice(0, 1000);
      job.leaseOwner = null; job.leaseUntil = null; job.updatedAt = new Date(this.clock()).toISOString();
      if (job.attempts >= job.maxAttempts) {
        job.status = 'dead'; job.finishedAt = job.updatedAt;
      } else {
        const delayMs = Math.min(60_000 * (2 ** Math.max(0, job.attempts - 1)), 60 * 60_000);
        job.status = 'scheduled'; job.availableAt = new Date(this.clock() + delayMs).toISOString();
      }
    });
  }

  async list({ tenantId, status, limit = 50 } = {}) {
    const state = await this.store.read();
    let rows = (state.jobs || []).filter(job => (!tenantId || job.tenantId === tenantId) && (!status || job.status === status));
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows.slice(0, Math.max(1, Math.min(Number.isInteger(limit) ? limit : 50, 100)));
  }

  async #finish(jobId, workerId, mutate) {
    return this.store.update(state => {
      const job = (state.jobs || []).find(row => row.id === jobId);
      if (!job) throw error('JOB_NOT_FOUND', 'Job not found.', 404);
      if (TERMINAL.has(job.status)) return job;
      if (job.status !== 'running' || job.leaseOwner !== workerId) throw error('LEASE_MISMATCH', 'This worker does not hold the job lease.', 409);
      mutate(job); return job;
    });
  }
}
function error(code, message, status) { return Object.assign(new Error(message), { code, status }); }
