import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from './xspresso_json_store.js';
import { CreditLedgerService } from './xspresso_credit_ledger_service_v1.js';

async function setup(t) {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-credits-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = new JsonStore(join(dir, 'db.json'));
  await store.init();
  return { store, ledger: new CreditLedgerService({ store, clock: () => Date.parse('2026-10-09T12:00:00Z') }) };
}

test('ledger posts grants and debits once when the idempotency key repeats', async t => {
  const { ledger } = await setup(t);
  const grant = await ledger.post({ tenantId: 't1', kind: 'grant', credits: 100, reason: 'Test grant', idempotencyKey: 'grant-test-001' });
  const duplicate = await ledger.post({ tenantId: 't1', kind: 'grant', credits: 100, reason: 'Test grant', idempotencyKey: 'grant-test-001' });
  assert.equal(grant.balance, 100);
  assert.equal(duplicate.duplicate, true);
  await ledger.post({ tenantId: 't1', kind: 'debit', credits: 35, reason: 'Generation', idempotencyKey: 'debit-test-001' });
  assert.equal((await ledger.balance('t1')).balance, 65);
});

test('ledger rejects insufficient balance and does not mutate it', async t => {
  const { ledger } = await setup(t);
  await assert.rejects(ledger.post({ tenantId: 't1', kind: 'debit', credits: 1, idempotencyKey: 'debit-test-002' }), { code: 'INSUFFICIENT_CREDITS' });
  assert.equal((await ledger.balance('t1')).balance, 0);
});

test('ledger balances are tenant-scoped', async t => {
  const { ledger } = await setup(t);
  await ledger.post({ tenantId: 't1', kind: 'grant', credits: 12, idempotencyKey: 'grant-test-101' });
  await ledger.post({ tenantId: 't2', kind: 'grant', credits: 7, idempotencyKey: 'grant-test-102' });
  assert.equal((await ledger.balance('t1')).balance, 12);
  assert.equal((await ledger.balance('t2')).balance, 7);
});
