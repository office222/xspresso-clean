import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, disposeTestContext } from './xspresso_test_helpers.js';

test('JsonStore initializes an empty schema and persists updates', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  const initial = await context.store.read();
  assert.deepEqual(initial, { schemaVersion: 1, users: [], campaigns: [], auditEvents: [] });
  await context.store.update(state => state.campaigns.push({ id: 'c1', tenantId: 't1' }));
  assert.equal((await context.store.read()).campaigns[0].id, 'c1');
});

test('JsonStore serializes concurrent updates without losing increments', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  await Promise.all(Array.from({ length: 25 }, (_, i) => context.store.update(state => {
    state.auditEvents.push({ id: `event-${i}` });
  })));
  const state = await context.store.read();
  assert.equal(state.auditEvents.length, 25);
});

test('JsonStore returns detached data so callers cannot mutate stored state', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  const detached = await context.store.read();
  detached.users.push({ id: 'outside-write' });
  assert.equal((await context.store.read()).users.length, 0);
});
