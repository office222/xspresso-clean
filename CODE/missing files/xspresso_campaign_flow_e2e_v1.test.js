import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from './xspresso_config_v1.js';
import { createOpenAIEnabledWebRuntime } from './xspresso_web_runtime_openai_v1.js';

const validDraft = {
  headline: 'A clearer daily workflow',
  subheadline: 'Spend less time coordinating routine work.',
  hooks: ['Make your next workday simpler.'],
  ads: [{ primaryText: 'Bring your daily tasks into one organized workspace.', headline: 'Work with more clarity', callToAction: 'Learn more' }],
  landingPage: { headline: 'A simpler way to work', body: 'Explore the tools and decide whether they fit your team.' },
  followUpEmails: [{ subject: 'Thanks for taking a look', body: 'Reply if you would like more information.', delayDays: 1 }]
};

test('signup → create → generate → edit → approve; approval does not publish', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'xspresso-e2e-'));
  const env = {
    NODE_ENV: 'test', XSPRESSO_DATA_DIR: directory, XSPRESSO_SIGNUP_ENABLED: 'true',
    OPENAI_API_KEY: 'test-key-never-sent-to-browser', OPENAI_MODEL: 'test-model',
    XSPRESSO_GENERATION_CREDIT_COST: '0'
  };
  const config = { ...loadConfig(env), host: '127.0.0.1', port: 0 };
  let providerCalls = 0;
  const fetchImpl = async (_url, options) => {
    providerCalls += 1;
    assert.equal(options.headers.authorization, 'Bearer test-key-never-sent-to-browser');
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    return new Response(JSON.stringify({
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(validDraft) }] }]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const runtime = createOpenAIEnabledWebRuntime({ env, config, fetchImpl });
  let baseUrl;
  try {
    const address = await runtime.listen();
    const port = address?.port || runtime.server?.address?.()?.port;
    assert.ok(port, 'runtime should listen on an ephemeral port');
    baseUrl = `http://127.0.0.1:${port}`;

    const signup = await post(baseUrl, '/api/auth/signup', { email: 'owner@example.test', password: 'a-long-test-password-123', name: 'Owner' });
    assert.ok(signup.response.status < 300, JSON.stringify(signup.data));
    const token = signup.data.token;
    assert.ok(token);

    const created = await post(baseUrl, '/api/campaigns', {
      name: 'Workflow test', platform: 'general', goal: 'awareness',
      brief: { productName: 'TaskNest', audience: 'small teams', verifiedClaims: ['Organizes daily tasks'] }
    }, token);
    assert.ok(created.response.status < 300, JSON.stringify(created.data));
    const campaignId = created.data.campaign.id;

    const generated = await post(baseUrl, `/api/campaigns/${campaignId}/generate`, { notes: 'Keep the language calm and practical.' }, token, { 'idempotency-key': 'e2e-generation-0001' });
    assert.ok(generated.response.status < 300, JSON.stringify(generated.data));
    assert.equal(providerCalls, 1);

    const loaded = await get(baseUrl, `/api/campaigns/${campaignId}/draft`, token);
    assert.equal(loaded.response.status, 200);
    assert.equal(loaded.data.version, 0);
    const edited = structuredClone(loaded.data.draft);
    edited.headline = 'A calmer way to organize work';
    const saved = await post(baseUrl, `/api/campaigns/${campaignId}/draft`, { expectedVersion: loaded.data.version, draft: edited }, token, {}, 'PUT');
    assert.ok(saved.response.status < 300, JSON.stringify(saved.data));
    assert.equal(saved.data.version, 1);

    const approved = await post(baseUrl, `/api/campaigns/${campaignId}/approve`, { expectedVersion: saved.data.version }, token);
    assert.ok(approved.response.status < 300, JSON.stringify(approved.data));
    assert.equal(approved.data.reviewStatus, 'approved');

    const finalCampaign = await get(baseUrl, `/api/campaigns/${campaignId}`, token);
    assert.equal(finalCampaign.response.status, 200);
    assert.equal(finalCampaign.data.campaign.status, 'draft', 'approval must not publish or activate the campaign');
    assert.equal(finalCampaign.data.campaign.assets.approvedDraft.headline, 'A calmer way to organize work');

    const replay = await post(baseUrl, `/api/campaigns/${campaignId}/generate`, { notes: 'Keep the language calm and practical.' }, token, { 'idempotency-key': 'e2e-generation-0001' });
    assert.ok(replay.response.status < 300);
    assert.equal(providerCalls, 1, 'idempotent retry must not call the model again');
  } finally {
    await runtime.close().catch(() => {});
    await rm(directory, { recursive: true, force: true });
  }
});

async function get(base, path, token) {
  const response = await fetch(base + path, { headers: { authorization: `Bearer ${token}` } });
  return { response, data: await response.json() };
}
async function post(base, path, data, token = '', extraHeaders = {}, method = 'POST') {
  const response = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...extraHeaders },
    body: JSON.stringify(data)
  });
  return { response, data: await response.json() };
}
