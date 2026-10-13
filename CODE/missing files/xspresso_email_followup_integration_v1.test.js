import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from './xspresso_config_v1.js';
import { createXspressoEmailRuntime } from './xspresso_email_openai_runtime_v1.js';

const draft = {
  headline: 'A clearer workspace', subheadline: 'Simple tools for busy teams.', hooks: ['Spend less time on manual updates.'],
  ads: [{ headline: 'Make work simpler', primaryText: 'See a calmer way to organize projects.', callToAction: 'Learn more' }],
  landingPage: { headline: 'Work with more clarity', body: 'Review the features and see whether they fit your team.', callToAction: 'Explore features' },
  followUpEmails: [{ subject: 'A quick follow-up', body: 'Would a short product walkthrough help?', delayDays: 0 }]
};

test('signup → AI draft → approval → consented follow-up → public unsubscribe', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-mail-e2e-'));
  const env = {
    NODE_ENV: 'test', PORT: '3000', HOST: '127.0.0.1', XSPRESSO_DATA_DIR: dir, XSPRESSO_SIGNUP_ENABLED: 'true',
    OPENAI_API_KEY: 'test-only-key', OPENAI_MODEL: 'test-model', XSPRESSO_GENERATION_CREDIT_COST: '0',
    SMTP_HOST: 'smtp.example.test', SMTP_PORT: '587', SMTP_FROM: 'Xspresso <mailer@example.test>', SMTP_USER: 'test-user', SMTP_PASSWORD: 'test-password',
    XSPRESSO_UNSUBSCRIBE_SECRET: 'test-only-unsubscribe-secret-32-bytes-min', XSPRESSO_PUBLIC_BASE_URL: 'https://xspresso.example.test'
  };
  const sentMessages = [];
  const nodemailerModule = { createTransport() { return { async sendMail(message) { sentMessages.push(message); return { messageId: '<e2e-message@example.test>', accepted: [message.to] }; }, close() {} }; } };
  const fetchImpl = async (_url, init) => {
    assert.match(init.headers.authorization, /^Bearer test-only-key$/);
    return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(draft) }] }] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const config = { ...loadConfig(env), port: 0, host: '127.0.0.1' };
  const runtime = createXspressoEmailRuntime({ env, config, fetchImpl, nodemailerModule });
  let base;
  try {
    const address = await runtime.listen();
    base = `http://127.0.0.1:${address.port}`;
    await runtime.scheduler.stop(); // Keep this test deterministic; drain explicitly below.

    const signup = await api(base, '/api/auth/signup', { method: 'POST', body: { name: 'Test Owner', email: 'owner@example.test', password: 'Strong-Test-Password-2026!' } });
    assert.ok(signup.status < 300, JSON.stringify(signup.json));
    const token = signup.json.token;
    const headers = { authorization: `Bearer ${token}` };

    const campaignResult = await api(base, '/api/campaigns', { method: 'POST', headers, body: { name: 'Spring launch', goal: 'Awareness', platform: 'general', brief: { productName: 'Focus board', audience: 'Small teams', verifiedClaims: [] } } });
    assert.ok(campaignResult.status < 300, JSON.stringify(campaignResult.json));
    const campaignId = campaignResult.json.campaign.id;

    const generated = await api(base, `/api/campaigns/${campaignId}/generate`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'e2e-generation-0001' }, body: { notes: 'Keep it calm and factual.' } });
    assert.ok(generated.status < 300, JSON.stringify(generated.json));
    const currentDraft = await api(base, `/api/campaigns/${campaignId}/draft`, { headers });
    assert.equal(currentDraft.json.version, 0);
    const edited = structuredClone(currentDraft.json.draft);
    edited.headline = 'A calmer way to plan the week';
    const saved = await api(base, `/api/campaigns/${campaignId}/draft`, { method: 'PUT', headers, body: { expectedVersion: 0, draft: edited } });
    assert.ok(saved.status < 300, JSON.stringify(saved.json));
    const approved = await api(base, `/api/campaigns/${campaignId}/approve`, { method: 'POST', headers, body: { expectedVersion: saved.json.version } });
    assert.ok(approved.status < 300, JSON.stringify(approved.json));

    const leadResult = await api(base, '/api/leads', { method: 'POST', headers, body: { name: 'Casey', email: 'casey@example.test', consent: true, source: 'e2e-test' } });
    assert.ok(leadResult.status < 300, JSON.stringify(leadResult.json));
    const leadId = leadResult.json.lead.id;
    const enrollment = await api(base, `/api/leads/${leadId}/followups`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'e2e-followup-0001' }, body: { campaignId } });
    assert.ok(enrollment.status < 300, JSON.stringify(enrollment.json));

    const drained = await runtime.scheduler.tick();
    assert.equal(drained.sent, 1);
    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0].list.unsubscribe.includes('/api/unsubscribe?token='), true);
    assert.match(sentMessages[0].text, /stop receiving/);

    const unsubUrl = new URL(sentMessages[0].list.unsubscribe);
    const unsubscribeToken = unsubUrl.searchParams.get('token');
    const unsubscribe = await fetch(`${base}/api/unsubscribe`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: unsubscribeToken }) });
    assert.equal(unsubscribe.status, 200);
    const leads = await api(base, '/api/leads', { headers });
    assert.equal(leads.json.leads.find(row => row.id === leadId).status, 'unsubscribed');
    const secondDrain = await runtime.scheduler.tick();
    assert.equal(secondDrain.sent, 0);
    assert.equal(sentMessages.length, 1);
  } finally {
    await runtime.close().catch(() => {});
    await runtime.mailer?.close().catch(() => {});
    await rm(dir, { recursive: true, force: true });
  }
});

async function api(base, path, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const text = await response.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { status: response.status, json };
}
