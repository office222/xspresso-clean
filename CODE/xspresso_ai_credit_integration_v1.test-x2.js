import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIResponsesProvider } from './xspresso_openai_responses_provider_v1.js';
import { CreditLedgerService } from './xspresso_credit_ledger_service_v1.js';

function memoryStore(initial = {}) {
  let state = structuredClone({ creditLedger: [], auditEvents: [], ...initial });
  return {
    async read() { return structuredClone(state); },
    async update(mutator) { const draft = structuredClone(state); const result = await mutator(draft); state = draft; return structuredClone(result); }
  };
}
const draft = {
  headline: 'A better way to organize', subheadline: 'Tools for busy teams', hooks: ['Save time'],
  ads: [{ headline: 'Work clearly', primaryText: 'Bring your team together.', callToAction: 'Learn more' }],
  landingPage: { headline: 'Work clearly', body: 'A simple workspace for your projects.', callToAction: 'Learn more' },
  followUpEmails: [{ subject: 'Thanks for taking a look', body: 'Here are the details.', delayDays: 1 }]
};

test('OpenAI Responses adapter sends strict JSON schema and extracts structured output', async () => {
  let captured;
  const provider = new OpenAIResponsesProvider({
    apiKey: 'secret-test-key', model: 'test-model',
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(draft) }] }] }), { status: 200 });
    }
  });
  const result = await provider.generate({ messages: [{ role: 'system', content: 'Create JSON.' }, { role: 'user', content: '{"brief":{}}' }] });
  assert.equal(result.headline, draft.headline);
  assert.equal(captured.url, 'https://api.openai.com/v1/responses');
  assert.equal(captured.options.headers.authorization, 'Bearer secret-test-key');
  const body = JSON.parse(captured.options.body);
  assert.equal(body.store, false);
  assert.equal(body.text.format.type, 'json_schema');
  assert.equal(body.text.format.strict, true);
  assert.equal(body.text.format.schema.additionalProperties, false);
});

test('provider errors are sanitized and incomplete output is rejected', async () => {
  const rejected = new OpenAIResponsesProvider({ apiKey: 'must-not-leak', model: 'test', fetchImpl: async () => new Response('{"error":"private provider detail"}', { status: 401 }) });
  await assert.rejects(() => rejected.generate({ messages: [{ role: 'user', content: 'x' }] }), error => {
    assert.equal(error.code, 'AI_PROVIDER_REQUEST_REJECTED');
    assert.equal(error.status, 502);
    assert.equal(error.message.includes('must-not-leak'), false);
    assert.equal(error.message.includes('private provider detail'), false);
    return true;
  });
  const incomplete = new OpenAIResponsesProvider({ apiKey: 'x', model: 'test', fetchImpl: async () => new Response(JSON.stringify({ status: 'incomplete', output: [] }), { status: 200 }) });
  await assert.rejects(() => incomplete.generate({ messages: [{ role: 'user', content: 'x' }] }), { code: 'AI_OUTPUT_INCOMPLETE' });
});

test('credit ledger is append-only, tenant-scoped, and idempotent', async () => {
  const store = memoryStore();
  const ledger = new CreditLedgerService({ store, clock: () => Date.parse('2026-10-09T12:00:00Z') });
  const grant = await ledger.post({ tenantId: 'tenant-a', actorId: 'admin', actorRole: 'admin', kind: 'grant', credits: 20, reason: 'Trial', idempotencyKey: 'grant-key-0001' });
  assert.equal(grant.balance, 20);
  const debit = await ledger.post({ tenantId: 'tenant-a', actorId: 'user-a', kind: 'debit', credits: 7, reason: 'Draft generation', idempotencyKey: 'debit-key-0001' });
  assert.equal(debit.balance, 13);
  const replay = await ledger.post({ tenantId: 'tenant-a', actorId: 'user-a', kind: 'debit', credits: 7, reason: 'Draft generation', idempotencyKey: 'debit-key-0001' });
  assert.equal(replay.duplicate, true);
  assert.equal(replay.balance, 13);
  assert.equal((await ledger.getBalance('tenant-b')).balance, 0);
  await assert.rejects(() => ledger.post({ tenantId: 'tenant-a', actorId: 'user-a', kind: 'debit', credits: 14, reason: 'Too much', idempotencyKey: 'debit-key-0002' }), { code: 'INSUFFICIENT_CREDITS', status: 402 });
  await assert.rejects(() => ledger.post({ tenantId: 'tenant-a', actorId: 'user-a', kind: 'grant', credits: 50, reason: 'No admin', idempotencyKey: 'grant-key-0002' }), { code: 'FORBIDDEN', status: 403 });
});
