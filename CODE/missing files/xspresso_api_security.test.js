import test from 'node:test';
import assert from 'node:assert/strict';
import { callApi, createTestContext, disposeTestContext, makeRequest, makeResponse } from './xspresso_test_helpers.js';

test('signup can be disabled by configuration', async t => {
  const context = await createTestContext({ config: { signupsEnabled: false } });
  t.after(() => disposeTestContext(context));
  const result = await callApi(context.api, { method: 'POST', url: '/api/auth/signup', body: { email: 'a@example.com', password: 'correct-horse-battery-42' } });
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.json.error, 'SIGNUPS_DISABLED');
});

test('login errors do not disclose whether an account exists', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  const result = await callApi(context.api, { method: 'POST', url: '/api/auth/login', body: { email: 'missing@example.com', password: 'wrong-password-123' } });
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.json.message, 'Email or password is incorrect.');
});

test('oversized JSON bodies are rejected with HTTP 413 status', async t => {
  const context = await createTestContext({ config: { bodyLimitBytes: 12 } });
  t.after(() => disposeTestContext(context));
  const req = makeRequest({ method: 'POST', url: '/api/auth/signup', body: { email: 'long@example.com', password: 'correct-horse-battery-42' } });
  const res = makeResponse();
  await assert.rejects(context.api(req, res), error => error.status === 413);
});

test('bearer token parsing rejects malformed authorization headers', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  const result = await callApi(context.api, { url: '/api/campaigns', headers: { authorization: 'Basic not-a-token' } });
  assert.equal(result.res.statusCode, 401);
});
