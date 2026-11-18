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


test('registered accounts receive isolated private campaign workspaces', async () => {
  const runtime = createXspressoRuntimeV2({
    store: memoryStore(),
    config: { port: 0, host: '127.0.0.1', dataFile: './unused.json', bodyLimitBytes: 100_000, sessionTtlMs: 3_600_000, signupEnabled: true },
    rateLimiter: { consume: () => ({ allowed: true }) }
  });
  try {
    const address = await runtime.listen();
    const base = `http://127.0.0.1:${address.port}`;
    async function signup(email) {
      const response = await fetch(`${base}/api/auth/signup`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'long-test-password-2026', name: email.split('@')[0] })
      });
      assert.equal(response.status, 201);
      return response.json();
    }
    const ownerA = await signup('owner-a@example.test');
    const ownerB = await signup('owner-b@example.test');
    assert.notEqual(ownerA.user.tenantId, ownerB.user.tenantId);

    const created = await fetch(`${base}/api/campaigns`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ownerA.token}` },
      body: JSON.stringify({ name: 'Private campaign A' })
    });
    assert.equal(created.status, 201);
    const campaign = (await created.json()).campaign;

    const listB = await fetch(`${base}/api/campaigns`, { headers: { authorization: `Bearer ${ownerB.token}` } });
    assert.equal(listB.status, 200);
    assert.deepEqual((await listB.json()).campaigns, []);

    const readB = await fetch(`${base}/api/campaigns/${campaign.id}`, { headers: { authorization: `Bearer ${ownerB.token}` } });
    assert.equal(readB.status, 404);

    const logout = await fetch(`${base}/api/auth/logout`, {
      method: 'POST', headers: { authorization: `Bearer ${ownerA.token}` }
    });
    assert.equal(logout.status, 200);
    const afterLogout = await fetch(`${base}/api/campaigns`, { headers: { authorization: `Bearer ${ownerA.token}` } });
    assert.equal(afterLogout.status, 401);
  } finally {
    await runtime.close();
  }
});
