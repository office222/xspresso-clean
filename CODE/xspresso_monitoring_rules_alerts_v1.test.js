import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAdMetrics } from './xspresso_monitoring_rule_engine_v1.js';
import { AlertRepository } from './xspresso_alert_repository_v1.js';

function memoryStore(initial = {}) {
  let state = structuredClone({ campaigns: [], alerts: [], ...initial });
  return {
    async read() { return structuredClone(state); },
    async update(mutator) { const draft = structuredClone(state); const result = await mutator(draft); state = draft; return structuredClone(result); }
  };
}

test('monitoring waits for enough impressions and clicks', () => {
  assert.equal(evaluateAdMetrics({ impressions: 20, clicks: 2, spend: 4, conversions: 0 }).status, 'insufficient_data');
});

test('monitoring flags clicks without conversions after configured sample size', () => {
  const result = evaluateAdMetrics({ impressions: 1000, clicks: 30, spend: 24, conversions: 0 }, { minimumImpressions: 100, minimumClicks: 10, clicksWithoutConversion: 30 });
  assert.equal(result.status, 'underperforming');
  assert.equal(result.recommendation.type, 'no_conversions');
});

test('monitoring applies configured CPC and CTR thresholds', () => {
  const cpc = evaluateAdMetrics({ impressions: 1000, clicks: 20, spend: 60, conversions: 1 }, { cpcWarning: 2 });
  assert.equal(cpc.recommendation.type, 'high_cpc');
  const ctr = evaluateAdMetrics({ impressions: 1000, clicks: 10, spend: 4, conversions: 1 }, { minimumClicks: 1, ctrWarning: 1.5 });
  assert.equal(ctr.recommendation.type, 'low_ctr');
});

test('alert repository refreshes a same-day duplicate instead of creating another', async () => {
  let clock = Date.parse('2026-10-09T12:00:00Z');
  const alerts = new AlertRepository({ store: memoryStore(), clock: () => clock });
  const first = await alerts.createOrRefresh({ tenantId: 't1', campaignId: 'c1', adId: 'a1', type: 'low_ctr', severity: 'warning', title: 'Needs review', message: 'CTR is low.' });
  clock += 60_000;
  const second = await alerts.createOrRefresh({ tenantId: 't1', campaignId: 'c1', adId: 'a1', type: 'low_ctr', severity: 'warning', title: 'Needs review', message: 'CTR remains low.' });
  assert.equal(second.id, first.id);
  assert.equal(second.occurrences, 2);
  assert.equal((await alerts.list({ tenantId: 't1' })).length, 1);
});

test('alerts are tenant-scoped and can be resolved', async () => {
  const alerts = new AlertRepository({ store: memoryStore() });
  const row = await alerts.createOrRefresh({ tenantId: 'tenant-a', campaignId: 'campaign-a', type: 'high_cpc', severity: 'warning', title: 'Review', message: 'Cost rose.' });
  assert.equal((await alerts.list({ tenantId: 'tenant-b' })).length, 0);
  await alerts.resolve({ tenantId: 'tenant-a', alertId: row.id, actorId: 'user-a' });
  assert.equal((await alerts.list({ tenantId: 'tenant-a', status: 'resolved' })).length, 1);
});
