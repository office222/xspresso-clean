import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from './xspresso_json_store.js';
import { AuthService } from './xspresso_auth.js';
import { LeadService } from './xspresso_lead_service_v1.js';
import { CreditLedgerService } from './xspresso_credit_ledger_service_v1.js';
import { MetricsService } from './xspresso_metrics_service_v1.js';
import { SettingsService } from './xspresso_settings_service_v1.js';
import { createApiHandler } from './xspresso_api_routes_v2.js';

function fakeResponse() {
  return { headersSent: false, status: 0, headers: {}, body: '',
    writeHead(status, headers = {}) { this.status = status; this.headers = headers; this.headersSent = true; },
    end(body = '') { this.body = String(body); }, json() { return this.body ? JSON.parse(this.body) : null; } };
}
async function call(api, { path, method = 'GET', token, body } = {}) {
  const req = { url: path, method, headers: token ? { authorization: `Bearer ${token}` } : {},
    async *[Symbol.asyncIterator]() { if (body !== undefined) yield Buffer.from(JSON.stringify(body)); } };
  const res = fakeResponse();
  await api(req, res);
  return { status: res.status, body: res.json() };
}

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-api-v2-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = new JsonStore(join(dir, 'state.json'));
  await store.init();
  const auth = new AuthService({ store });
  const services = { leads: new LeadService({ store }), credits: new CreditLedgerService({ store }),
    metrics: new MetricsService({ store }), settings: new SettingsService({ store }) };
  const api = createApiHandler({ store, auth, services, config: { signupsEnabled: true, bodyLimitBytes: 1024 * 1024 } });
  const signup = await call(api, { path: '/api/auth/signup', method: 'POST', body: { email: 'owner@example.com', password: 'correct horse battery', name: 'Owner' } });
  assert.equal(signup.status, 201);
  return { store, api, token: signup.body.token };
}

test('API v2 creates tenant-scoped campaign and lead, then records a timeline event', async t => {
  const { api, token } = await fixture(t);
  const campaign = await call(api, { path: '/api/campaigns', method: 'POST', token, body: { name: 'Spring offer' } });
  assert.equal(campaign.status, 201);
  const lead = await call(api, { path: '/api/leads', method: 'POST', token, body: {
    email: 'lead@example.com', name: 'Lead', campaignId: campaign.body.campaign.id, consent: true
  } });
  assert.equal(lead.status, 201);
  assert.equal(lead.body.lead.status, 'new');
  const event = await call(api, { path: `/api/leads/${lead.body.lead.id}/events`, method: 'POST', token, body: { type: 'replied', note: 'Asked for details' } });
  assert.equal(event.status, 201);
  assert.equal(event.body.lead.timeline.at(-1).type, 'replied');
});

test('API v2 exposes settings and daily metric reporting, but does not allow client credit grants', async t => {
  const { api, token } = await fixture(t);
  const campaign = await call(api, { path: '/api/campaigns', method: 'POST', token, body: { name: 'Metrics test' } });
  const id = campaign.body.campaign.id;
  const setting = await call(api, { path: '/api/settings', method: 'PATCH', token, body: { tone: 'friendly', monitoringEnabled: false } });
  assert.equal(setting.status, 200);
  assert.equal(setting.body.settings.tone, 'friendly');
  const snapshot = await call(api, { path: `/api/campaigns/${id}/metrics/daily`, method: 'PUT', token,
    body: { date: '2026-10-09', impressions: 1000, clicks: 30, spend: 15, conversions: 3 } });
  assert.equal(snapshot.status, 200);
  const report = await call(api, { path: '/api/metrics/report?from=2026-10-09&to=2026-10-09', token });
  assert.equal(report.body.totals.clicks, 30);
  assert.equal(report.body.totals.ctr, 0.03);
  const credits = await call(api, { path: '/api/credits', token });
  assert.equal(credits.status, 200);
  assert.equal(credits.body.balance, 0);
  const forbidden = await call(api, { path: '/api/credits', method: 'POST', token, body: { credits: 999999 } });
  assert.equal(forbidden.status, 404);
});

test('API v2 prevents one account from reading another account\'s leads', async t => {
  const { store, api, token } = await fixture(t);
  const created = await call(api, { path: '/api/leads', method: 'POST', token, body: { email: 'private@example.com', consent: true } });
  const secondSignup = await call(api, { path: '/api/auth/signup', method: 'POST', body: { email: 'other@example.com', password: 'another strong password' } });
  const result = await call(api, { path: `/api/leads/${created.body.lead.id}/events`, method: 'POST', token: secondSignup.body.token, body: { type: 'note' } });
  assert.equal(result.status, 404);
  const state = await store.read();
  assert.equal(state.leads.length, 1);
});
