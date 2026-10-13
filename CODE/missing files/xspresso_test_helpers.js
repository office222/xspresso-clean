import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from './xspresso_json_store.js';
import { AuthService } from './xspresso_auth.js';
import { createApiHandler } from './xspresso_api_routes.js';

export async function createTestContext(overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'xspresso-test-'));
  const store = new JsonStore(join(directory, 'data.json'));
  await store.init();
  const auth = new AuthService({ store, sessionTtlMs: overrides.sessionTtlMs ?? 60_000, clock: overrides.clock });
  const config = { signupsEnabled: true, bodyLimitBytes: 64 * 1024, ...overrides.config };
  return { directory, store, auth, config, api: createApiHandler({ store, auth, config }) };
}

export async function disposeTestContext(context) {
  if (context?.directory) await rm(context.directory, { recursive: true, force: true });
}

export function makeRequest({ method = 'GET', url = '/api/health', headers = {}, body } = {}) {
  const requestBody = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return {
    method,
    url,
    headers,
    async *[Symbol.asyncIterator]() {
      if (requestBody) yield Buffer.from(requestBody);
    }
  };
}

export function makeResponse() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    headersSent: false,
    writeHead(status, headers = {}) {
      this.statusCode = status;
      this.headers = { ...headers };
      this.headersSent = true;
      return this;
    },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(body = '') { this.body = String(body); this.ended = true; return this; }
  };
}

export async function callApi(api, options = {}) {
  const req = makeRequest(options);
  const res = makeResponse();
  await api(req, res);
  let json = null;
  if (res.body) json = JSON.parse(res.body);
  return { req, res, json };
}

export async function createAccount(context, email = 'test@example.com') {
  return context.auth.register({ email, password: 'correct-horse-battery-42', name: 'Test User' });
}
