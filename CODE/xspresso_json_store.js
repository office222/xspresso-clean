/**
 * Small-file persistence adapter for local development and a single-process MVP.
 * Production deployments should replace this with a transactional database.
 * Writes are serialized within this Node process and atomically renamed.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const EMPTY_STATE = Object.freeze({ schemaVersion: 1, users: [], campaigns: [], auditEvents: [] });

export class JsonStore {
  #file;
  #queue = Promise.resolve();
  #initialized = false;

  constructor(filePath = './data/xspresso.json') {
    if (!filePath || typeof filePath !== 'string') throw new TypeError('A data file path is required.');
    this.#file = resolve(filePath);
  }

  async init() {
    if (this.#initialized) return;
    await mkdir(dirname(this.#file), { recursive: true });
    try {
      const state = await this.#readDisk();
      validateState(state);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      await this.#writeDisk(structuredClone(EMPTY_STATE));
    }
    this.#initialized = true;
  }

  async read() {
    await this.init();
    await this.#queue;
    return structuredClone(await this.#readDisk());
  }

  async update(mutator) {
    if (typeof mutator !== 'function') throw new TypeError('update requires a function.');
    await this.init();
    const operation = this.#queue.then(async () => {
      const draft = await this.#readDisk();
      const result = await mutator(draft);
      validateState(draft);
      await this.#writeDisk(draft);
      return structuredClone(result);
    });
    this.#queue = operation.catch(() => undefined);
    return operation;
  }

  async #readDisk() {
    const raw = await readFile(this.#file, 'utf8');
    let state;
    try { state = JSON.parse(raw); }
    catch { throw new Error(`Xspresso data file is invalid JSON: ${this.#file}`); }
    validateState(state);
    return state;
  }

  async #writeDisk(state) {
    const temp = `${this.#file}.${randomUUID()}.tmp`;
    await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    await rename(temp, this.#file);
  }
}

function validateState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new TypeError('Store state must be an object.');
  if (state.schemaVersion !== 1) throw new Error(`Unsupported data schema version: ${state.schemaVersion}`);
  for (const key of ['users', 'campaigns', 'auditEvents']) {
    if (!Array.isArray(state[key])) throw new TypeError(`Store field ${key} must be an array.`);
  }
}
