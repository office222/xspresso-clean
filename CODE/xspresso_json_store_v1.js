import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const COLLECTIONS = [
  'users', 'sessions', 'campaigns', 'leads', 'campaignRevisions', 'auditEvents',
  'generationRequests', 'creditLedger', 'followupEnrollments', 'alerts',
  'monitoringRuns', 'tenantSettings'
];

/**
 * Atomic JSON-file store for local development and single-process deployments.
 * Do not share this store file between multiple Node processes; use a database
 * adapter before horizontal scaling or production workloads.
 */
export class JsonStore {
  constructor({ filePath } = {}) {
    if (typeof filePath !== 'string' || !filePath.trim()) throw new TypeError('filePath is required.');
    this.filePath = resolve(filePath);
    this.state = null;
    this.ready = false;
    this.tail = Promise.resolve();
  }

  async init() {
    if (this.ready) return this;
    await mkdir(dirname(this.filePath), { recursive: true, mode: 0o700 });
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Store file must contain a JSON object.');
      this.state = normalize(parsed);
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`Unable to load Xspresso store: ${error.message}`, { cause: error });
      this.state = normalize({ schemaVersion: 1, createdAt: new Date().toISOString() });
      await this.persist(this.state);
    }
    this.ready = true;
    return this;
  }

  async read() {
    await this.waitReady();
    await this.tail;
    return structuredClone(this.state);
  }

  async update(mutator) {
    if (typeof mutator !== 'function') throw new TypeError('update requires a mutator function.');
    await this.waitReady();
    const operation = this.tail.then(async () => {
      const next = structuredClone(this.state);
      const result = await mutator(next);
      await this.persist(next);
      this.state = next;
      return structuredClone(result);
    });
    this.tail = operation.catch(() => {});
    return operation;
  }

  async flush() { await this.waitReady(); await this.tail; }

  async waitReady() {
    if (!this.ready) throw new Error('JsonStore.init() must complete before read or update.');
  }

  async persist(state) {
    const temp = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    try { await rename(temp, this.filePath); }
    catch (error) {
      const { unlink } = await import('node:fs/promises');
      await unlink(temp).catch(() => {});
      throw error;
    }
  }
}

function normalize(value) {
  const state = { ...value };
  state.schemaVersion = Number.isInteger(state.schemaVersion) ? state.schemaVersion : 1;
  for (const name of COLLECTIONS) if (!Array.isArray(state[name])) state[name] = [];
  return state;
}
