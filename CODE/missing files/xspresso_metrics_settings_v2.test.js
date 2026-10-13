import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from './xspresso_json_store.js';
import { MetricsService } from './xspresso_metrics_service_v1.js';
import { SettingsService } from './xspresso_settings_service_v1.js';

async function setup(t) {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-settings-metrics-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = new JsonStore(join(dir, 'db.json'));
  await store.init();
  const user = { id: 'u1', tenantId: 't1' };
  await store.update(state => state.campaigns.push({ id: 'c1', tenantId: 't1' }));
  return { store, user, metrics: new MetricsService({ store }), settings: new SettingsService({ store }) };
}

test('daily metrics upsert replaces a same-day snapshot and derives ratios', async t => {
  const { metrics, user } = await setup(t);
  const first = await metrics.upsertDailySnapshot(user, 'c1', { date: '2026-10-09', impressions: 100, clicks: 10, spend: 5, conversions: 2 });
  const revised = await metrics.upsertDailySnapshot(user, 'c1', { date: '2026-10-09', impressions: 200, clicks: 20, spend: 8, conversions: 4 });
  assert.equal(first.ctr, 0.1);
  assert.equal(revised.cpc, 0.4);
  const report = await metrics.report(user, { from: '2026-10-09', to: '2026-10-09' });
  assert.equal(report.snapshotCount, 1);
  assert.equal(report.totals.impressions, 200);
});

test('metrics reject impossible dates and hide other tenants', async t => {
  const { metrics, user } = await setup(t);
  await assert.rejects(metrics.upsertDailySnapshot(user, 'c1', { date: '2026-02-30' }), { code: 'INVALID_DATE' });
  await assert.rejects(metrics.report({ id: 'u2', tenantId: 't2' }, { campaignId: 'c1' }), { code: 'CAMPAIGN_NOT_FOUND' });
});

test('settings enforce an allowlist and persist values per user', async t => {
  const { settings, user } = await setup(t);
  const saved = await settings.update(user, { tone: 'friendly', alerts: { cpcWarning: 2.25 } });
  assert.equal(saved.tone, 'friendly');
  assert.equal(saved.alerts.cpcWarning, 2.25);
  await assert.rejects(settings.update(user, { password: 'should-not-be-stored' }), { code: 'SETTING_NOT_ALLOWED' });
  assert.equal((await settings.get({ id: 'u2', tenantId: 't2' })).tone, 'simple');
});
