import test from 'node:test';
import assert from 'node:assert/strict';
import { XspressoWorkerScheduler } from './xspresso_worker_scheduler_v1.js';

test('cycle drains due follow-ups and monitors only eligible campaigns', async () => {
  let followupCalls = 0; const monitored = [];
  const scheduler = new XspressoWorkerScheduler({
    store: { read: async () => ({ campaigns: [
      { id: 'c1', tenantId: 't1', platform: 'meta', status: 'active' },
      { id: 'c2', tenantId: 't1', platform: 'search', status: 'paused' },
      { id: 'c3', tenantId: 't2', platform: 'video', status: 'active' }
    ] }) },
    followupWorker: { runOne: async () => ++followupCalls <= 2 ? { sent: true } : { sent: false, reason: 'nothing_due' } },
    monitoringWorker: { run: async input => { monitored.push(input); return { checked: true }; } },
    maxFollowupsPerCycle: 5
  });
  const result = await scheduler.tick();
  assert.equal(result.followupsAttempted, 2); assert.equal(followupCalls, 3);
  assert.equal(result.campaignsChecked, 2);
  assert.deepEqual(monitored, [{ tenantId: 't1', campaignId: 'c1' }, { tenantId: 't2', campaignId: 'c3' }]);
});

test('overlapping cycles are skipped rather than running jobs concurrently', async () => {
  let release; let runs = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const scheduler = new XspressoWorkerScheduler({
    store: { read: async () => ({ campaigns: [] }) },
    followupWorker: { runOne: async () => { runs += 1; await gate; return { sent: false, reason: 'nothing_due' }; } },
    monitoringWorker: { run: async () => ({}) }
  });
  const first = scheduler.tick();
  await new Promise(resolve => setImmediate(resolve));
  const second = await scheduler.tick();
  assert.deepEqual(second, { skipped: true, reason: 'cycle_in_progress' });
  release(); await first; assert.equal(runs, 1);
});

test('start is idempotent and stop clears its timer', async () => {
  let callback; let cleared = false;
  const timers = { setInterval(fn) { callback = fn; return { unref() {} }; }, clearInterval() { cleared = true; } };
  const scheduler = new XspressoWorkerScheduler({
    store: { read: async () => ({ campaigns: [] }) },
    followupWorker: { runOne: async () => ({ sent: false, reason: 'nothing_due' }) },
    monitoringWorker: { run: async () => ({}) }, timers
  });
  assert.equal(scheduler.start(), true); assert.equal(scheduler.start(), false);
  await new Promise(resolve => setImmediate(resolve));
  await scheduler.stop(); assert.equal(cleared, true); assert.equal(typeof callback, 'function');
});
