import test from 'node:test';
import assert from 'node:assert/strict';
import { callApi, createAccount, createTestContext, disposeTestContext } from './xspresso_test_helpers.js';

test('API exposes health and requires authentication for campaign routes', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  const health = await callApi(context.api, { url: '/api/health' });
  assert.equal(health.res.statusCode, 200);
  assert.equal(health.json.ok, true);
  const campaigns = await callApi(context.api, { url: '/api/campaigns' });
  assert.equal(campaigns.res.statusCode, 401);
});

test('campaign API supports tenant-scoped create, list, patch, and archive', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  const session = await createAccount(context);
  const auth = { authorization: `Bearer ${session.token}` };
  const created = await callApi(context.api, { method: 'POST', url: '/api/campaigns', headers: auth, body: { name: 'Launch', goal: 'leads', brief: { offer: 'X' } } });
  assert.equal(created.res.statusCode, 201);
  const id = created.json.campaign.id;
  assert.equal(created.json.campaign.status, 'draft');
  const patched = await callApi(context.api, { method: 'PATCH', url: `/api/campaigns/${id}`, headers: auth, body: { name: 'Updated launch', status: 'live' } });
  assert.equal(patched.res.statusCode, 200);
  assert.equal(patched.json.campaign.name, 'Updated launch');
  assert.equal(patched.json.campaign.status, 'draft', 'clients cannot set privileged lifecycle state');
  const listed = await callApi(context.api, { url: '/api/campaigns', headers: auth });
  assert.equal(listed.json.campaigns.length, 1);
  const archived = await callApi(context.api, { method: 'DELETE', url: `/api/campaigns/${id}`, headers: auth });
  assert.equal(archived.json.status, 'archived');
});

test('campaign records are not visible across tenants', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  const owner = await createAccount(context, 'owner@example.com');
  const other = await createAccount(context, 'other@example.com');
  const created = await callApi(context.api, { method: 'POST', url: '/api/campaigns', headers: { authorization: `Bearer ${owner.token}` }, body: { name: 'Private campaign' } });
  const response = await callApi(context.api, { url: `/api/campaigns/${created.json.campaign.id}`, headers: { authorization: `Bearer ${other.token}` } });
  assert.equal(response.res.statusCode, 404);
});

test('campaign API rejects empty names and malformed JSON bodies', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  const session = await createAccount(context);
  const headers = { authorization: `Bearer ${session.token}` };
  const invalid = await callApi(context.api, { method: 'POST', url: '/api/campaigns', headers, body: { name: '   ' } });
  assert.equal(invalid.res.statusCode, 400);
  await assert.rejects(callApi(context.api, { method: 'POST', url: '/api/campaigns', headers, body: '{bad json' }), /JSON object/);
});
