import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from './xspresso_config_v1.js';
import { createXspressoMetricsWebRuntime } from './xspresso_metrics_web_runtime_v1.js';

const csvForToday = () => `date,ad_id,impressions,clicks,spend,conversions,currency\n${new Date().toISOString().slice(0,10)},ad-001,1000,80,24.50,0,USD\n`;

async function jsonRequest(base, path, { method = 'GET', token, body, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers,
      ...(body !== undefined && !headers['content-type'] ? { 'content-type': 'application/json' } : {}) },
    body: typeof body === 'string' ? body : body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

test('external link + CSV import + tenant-scoped metrics API', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-metrics-'));
  const env = { NODE_ENV: 'test', XSPRESSO_DATA_DIR: dir, XSPRESSO_SIGNUP_ENABLED: 'true' };
  const config = { ...loadConfig(env), host: '127.0.0.1', port: 0, dataFile: join(dir, 'app.json') };
  const runtime = createXspressoMetricsWebRuntime({ env, config });
  try {
    const address = await runtime.listen();
    const base = `http://127.0.0.1:${address.port}`;
    const signup = await jsonRequest(base, '/api/auth/signup', { method: 'POST', body: { email: 'owner@example.test', password: 'A-long-test-password-123!', name: 'Owner' } });
    assert.ok(signup.status < 300, JSON.stringify(signup.body));
    const token = signup.body.token;
    const created = await jsonRequest(base, '/api/campaigns', { method: 'POST', token, body: {
      name: 'Existing campaign', platform: 'meta', goal: 'Leads', brief: { product: 'Example', audience: 'Local customers' }
    } });
    assert.ok(created.status < 300, JSON.stringify(created.body));
    const campaignId = created.body.campaign.id;
    const linked = await jsonRequest(base, `/api/campaigns/${campaignId}/link-external`, {
      method: 'POST', token, body: { platform: 'meta', externalCampaignId: 'remote-123', confirmAlreadyLive: true }
    });
    assert.equal(linked.status, 200, JSON.stringify(linked.body));
    const imported = await fetch(`${base}/api/campaigns/${campaignId}/metrics/import`, {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'text/csv', 'idempotency-key': 'metrics-csv-001' }, body: csvForToday()
    });
    assert.equal(imported.status, 201, await imported.text());
    const metrics = await jsonRequest(base, `/api/campaigns/${campaignId}/metrics`, { token });
    assert.equal(metrics.status, 200);
    assert.equal(metrics.body.ads.length, 1);
    assert.equal(metrics.body.ads[0].metrics.clicks, 80);
    const replay = await fetch(`${base}/api/campaigns/${campaignId}/metrics/import`, {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'text/csv', 'idempotency-key': 'metrics-csv-001' }, body: csvForToday()
    });
    assert.ok(replay.status === 200 || replay.status === 409); // the date is generated per call; the key is never allowed to overwrite different bytes
  } finally {
    await runtime.close();
    await rm(dir, { recursive: true, force: true });
  }
});
