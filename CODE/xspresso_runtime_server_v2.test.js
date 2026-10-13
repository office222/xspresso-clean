import test from 'node:test';
import assert from 'node:assert/strict';
import { createXspressoRuntimeV2 } from './xspresso_runtime_server_v2.js';

function memoryStore() {
  let state = {};
  return {
    async init() {}, async flush() {},
    async read() { return structuredClone(state); },
    async update(fn) { const next = structuredClone(state); const result = await fn(next); state = next; return structuredClone(result); }
  };
}

test('runtime starts, serves health, registers an account, and stops cleanly', async () => {
  const runtime = createXspressoRuntimeV2({
    store: memoryStore(),
    config: { port: 0, host: '127.0.0.1', dataFile: './unused.json', bodyLimitBytes: 100_000, sessionTtlMs: 3_600_000, signupEnabled: true },
    rateLimiter: { consume: () => ({ allowed: true }) }
  });
  try {
    const address = await runtime.listen();
    const base = `http://127.0.0.1:${address.port}`;
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');

    const register = await fetch(`${base}/api/auth/signup`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'owner@example.test', password: 'long-test-password-2026', name: 'Owner' })
    });
    assert.equal(register.status, 201);
    const account = await register.json();
    assert.ok(account.token);
    assert.equal(account.user.email, 'owner@example.test');

    const me = await fetch(`${base}/api/auth/me`, { headers: { authorization: `Bearer ${account.token}` } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.id, account.user.id);
  } finally {
    await runtime.close();
  }
});

test('runtime applies auth rate limiting and returns Retry-After when blocked', async () => {
  const runtime = createXspressoRuntimeV2({
    store: memoryStore(), config: { port: 0, host: '127.0.0.1', dataFile: './unused.json', bodyLimitBytes: 100_000, sessionTtlMs: 3_600_000, signupEnabled: true },
    rateLimiter: { consume: () => ({ allowed: false, retryAfterSeconds: 12 }) }
  });
  try {
    const address = await runtime.listen();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'owner@example.test', password: 'wrong' })
    });
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '12');
  } finally {
    await runtime.close();
  }
});
