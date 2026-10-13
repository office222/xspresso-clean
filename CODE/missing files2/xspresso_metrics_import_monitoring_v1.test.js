import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from './xspresso_config_v1.js';
import { createXspressoMetricsWebRuntime } from './xspresso_metrics_web_runtime_v1.js';

async function json(response) { return response.json(); }

test('authenticated CSV metrics import is tenant-scoped and feeds monitoring alerts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-metrics-'));
  const env = { NODE_ENV: 'test', XSPRESSO_DATA_DIR: dir, XSPRESSO_SIGNUP_ENABLED: 'true', PORT: '3000' };
  const config = { ...loadConfig(env), port: 0, host: '127.0.0.1' };
  const runtime = createXspressoMetricsWebRuntime({ env, config });
  let base;
  try {
    const address = await runtime.listen();
    base = `http://127.0.0.1:${address.port}`;
    const signup = await fetch(`${base}/api/auth/signup`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'owner@example.test', password: 'correct horse battery staple', name: 'Owner' })
    });
    assert.ok(signup.status < 300, await signup.text());
    const { token, user } = await json(signup);
    const auth = { authorization: `Bearer ${token}` };

    const created = await fetch(`${base}/api/campaigns`, {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Spring launch', platform: 'meta', goal: 'traffic', brief: { productName: 'Notebook', audience: 'Readers' } })
    });
    assert.ok(created.status < 300, await created.text());
    const campaign = (await json(created)).campaign;

    const linked = await fetch(`${base}/api/campaigns/${campaign.id}/link-external`, {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ platform: 'meta', externalCampaignId: 'meta-123', confirmAlreadyLive: true })
    });
    assert.ok(linked.status < 300, await linked.text());

    const date = new Date().toISOString().slice(0, 10);
    const csv = `date,ad_id,impressions,clicks,spend,conversions,currency\n${date},ad-1,500,80,20.50,0,USD\n`;
    const upload = await fetch(`${base}/api/campaigns/${campaign.id}/metrics/import`, {
      method: 'POST', headers: { ...auth, 'content-type': 'text/csv', 'idempotency-key': 'metrics-import-001' }, body: csv
    });
    assert.ok(upload.status < 300, await upload.text());
    assert.equal((await json(upload)).import.rows, 1);

    const metricsResponse = await fetch(`${base}/api/campaigns/${campaign.id}/metrics`, { headers: auth });
    assert.equal(metricsResponse.status, 200);
    const metrics = await json(metricsResponse);
    assert.equal(metrics.ads[0].metrics.clicks, 80);
    assert.equal(metrics.ads[0].metrics.spend, 20.5);

    const monitored = await fetch(`${base}/api/campaigns/${campaign.id}/monitor`, {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ thresholds: { minimumImpressions: 1, minimumClicks: 1, clicksWithoutConversion: 30 } })
    });
    assert.equal(monitored.status, 200, await monitored.text());
    const alertsResponse = await fetch(`${base}/api/alerts?status=open`, { headers: auth });
    assert.equal(alertsResponse.status, 200);
    const alerts = await json(alertsResponse);
    assert.equal(alerts.alerts.length, 1);
    assert.equal(alerts.alerts[0].severity, 'critical');

    const second = await fetch(`${base}/api/auth/signup`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'other@example.test', password: 'correct horse battery staple', name: 'Other' })
    });
    assert.ok(second.status < 300, await second.text());
    const other = await json(second);
    const privateMetrics = await fetch(`${base}/api/campaigns/${campaign.id}/metrics`, { headers: { authorization: `Bearer ${other.token}` } });
    assert.equal(privateMetrics.status, 404);
    assert.ok(user.tenantId);
  } finally {
    await runtime.close();
    await rm(dir, { recursive: true, force: true });
  }
});
