import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig } from "./xspresso_config_v1.js";
import { createXspressoEmailNotificationRuntime } from "./xspresso_notification_email_runtime_v1.js";

const draft = headline => ({
  headline,
  subheadline: "A simple way to organize your work",
  hooks: ["Make your next step easier"],
  ads: [{
    primaryText: "Plan, organize, and move forward with confidence.",
    headline,
    callToAction: "Learn more"
  }],
  landingPage: {
    headline,
    body: "Explore a clearer way to plan your work."
  },
  followUpEmails: [{
    subject: "A little more about getting started",
    body: "Here are a few helpful next steps.",
    delayDays: 1
  }]
});

function responseForOpenAI(output) {
  return new Response(JSON.stringify({
    status: "completed",
    output: [{
      type: "message",
      content: [{
        type: "output_text",
        text: JSON.stringify(output)
      }]
    }]
  }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

async function request(origin, path, {
  token,
  method = "GET",
  body,
  idempotencyKey
} = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

  const res = await fetch(`${origin}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

test("signup ? generate ? iterate ? apply ? approve ? export remains human-controlled", async () => {
  const directory = await mkdtemp(join(tmpdir(), "xspresso-workflow-"));
  const env = {
    NODE_ENV: "test",
    XSPRESSO_DATA_DIR: directory,
    XSPRESSO_SIGNUP_ENABLED: "true",
    OPENAI_API_KEY: "test-key",
    OPENAI_MODEL: "test-model",
    XSPRESSO_GENERATION_CREDIT_COST: "0",
    XSPRESSO_ITERATION_CREDIT_COST: "0"
  };

  let modelCalls = 0;
  const fetchImpl = async () => {
    modelCalls += 1;
    return responseForOpenAI(
      modelCalls === 1
        ? draft("A clearer way to organize")
        : draft("Make space for focused work")
    );
  };

  const config = {
    ...loadConfig(env),
    host: "127.0.0.1",
    port: 0,
    dataFile: join(directory, "xspresso-test.json")
  };

  const runtime = createXspressoEmailNotificationRuntime({
    env,
    config,
    fetchImpl
  });

  try {
    const address = await runtime.listen();
    const origin = `http://127.0.0.1:${address.port}`;

    const signup = await request(origin, "/api/auth/signup", {
      method: "POST",
      body: {
        email: "workflow@example.test",
        password: "A-long-test-password-2026",
        name: "Workflow Test"
      }
    });
    assert.ok(signup.res.status < 300, JSON.stringify(signup.data));
    const token = signup.data.token;
    assert.ok(token);

    const created = await request(origin, "/api/campaigns", {
      token,
      method: "POST",
      body: {
        name: "Workflow test campaign",
        platform: "meta",
        goal: "traffic",
        brief: {
          productName: "Project Planner",
          description: "A lightweight planning tool",
          audience: "People who want to organize their work",
          offer: "Try the starter plan",
          brandVoice: "Clear, practical, encouraging",
          verifiedClaims: []
        }
      }
    });
    assert.ok(created.res.status < 300, JSON.stringify(created.data));
    const campaignId = created.data.campaign.id;

    const generated = await request(
      origin,
      `/api/campaigns/${campaignId}/generate`,
      {
        token,
        method: "POST",
        idempotencyKey: "workflow-generation-0001",
        body: { notes: "Keep the message practical and concise." }
      }
    );
    assert.ok(generated.res.status < 300, JSON.stringify(generated.data));

    const original = await request(
      origin,
      `/api/campaigns/${campaignId}/draft`,
      { token }
    );
    assert.ok(original.res.status < 300, JSON.stringify(original.data));
    const baseVersion = original.data.version;
    const originalHeadline = original.data.draft.headline;

    const proposed = await request(
      origin,
      `/api/campaigns/${campaignId}/proposals`,
      {
        token,
        method: "POST",
        idempotencyKey: "workflow-iteration-0001",
        body: {
          feedback: "Make it sound more focused and less generic.",
          baseVersion
        }
      }
    );
    assert.ok(proposed.res.status < 300, JSON.stringify(proposed.data));

    const proposal = proposed.data.proposal;
    assert.ok(proposal?.id);
    assert.notEqual(proposal.draft.headline, originalHeadline);

    // Generating a proposal must not overwrite the current draft.
    const unchanged = await request(
      origin,
      `/api/campaigns/${campaignId}/draft`,
      { token }
    );
    assert.equal(unchanged.data.draft.headline, originalHeadline);
    assert.equal(unchanged.data.version, baseVersion);

    const applied = await request(
      origin,
      `/api/campaigns/${campaignId}/proposals/${proposal.id}/apply`,
      {
        token,
        method: "POST",
        body: { expectedVersion: baseVersion }
      }
    );
    assert.ok(applied.res.status < 300, JSON.stringify(applied.data));

    const revised = await request(
      origin,
      `/api/campaigns/${campaignId}/draft`,
      { token }
    );
    assert.equal(revised.data.draft.headline, proposal.draft.headline);
    assert.ok(revised.data.version > baseVersion);

    const approved = await request(
      origin,
      `/api/campaigns/${campaignId}/approve`,
      {
        token,
        method: "POST",
        body: { expectedVersion: revised.data.version }
      }
    );
    assert.ok(approved.res.status < 300, JSON.stringify(approved.data));

    const kit = await request(
      origin,
      `/api/campaigns/${campaignId}/export/approved`,
      { token }
    );
    assert.ok(kit.res.status < 300, JSON.stringify(kit.data));
    assert.equal(kit.data.campaign.id, campaignId);
    assert.equal(kit.data.creative.headline, proposal.draft.headline);

    const campaign = await request(
      origin,
      `/api/campaigns/${campaignId}`,
      { token }
    );
    assert.ok(campaign.res.status < 300);
    assert.equal(campaign.data.campaign.status, "draft");
    assert.equal(modelCalls, 2);
  } finally {
    await runtime.close();
    await rm(directory, { recursive: true, force: true });
  }
});
