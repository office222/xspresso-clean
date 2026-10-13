xspresso_v1_campaign_workflow.e2e.test.js

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig } from "./xspresso_config_v1.js";
import { createXspressoEmailNotificationRuntime } from "./xspresso_notification_email_runtime_v1.js";

const makeDraft = headline => ({
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

async function jsonRequest(origin, path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.idempotencyKey) {
    headers["idempotency-key"] = options.idempotencyKey;
  }

  const response = await fetch(`${origin}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined
      ? undefined
      : JSON.stringify(options.body)
  });

  return {
    response,
    body: await response.json().catch(() => ({}))
  };
}

test("campaign draft can be iterated, applied, approved, and exported without publishing", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "xspresso-e2e-"));
  let modelCalls = 0;

  const fakeOpenAIFetch = async () => {
    modelCalls += 1;
    const draft = modelCalls === 1
      ? makeDraft("A clearer way to organize")
      : makeDraft("Make space for focused work");

    return new Response(JSON.stringify({
      status: "completed",
      output: [{
        type: "message",
        content: [{
          type: "output_text",
          text: JSON.stringify(draft)
        }]
      }]
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const env = {
    NODE_ENV: "test",
    XSPRESSO_DATA_DIR: dataDir,
    XSPRESSO_SIGNUP_ENABLED: "true",
    OPENAI_API_KEY: "test-key",
    OPENAI_MODEL: "test-model",
    XSPRESSO_GENERATION_CREDIT_COST: "0",
    XSPRESSO_ITERATION_CREDIT_COST: "0"
  };

  const config = {
    ...loadConfig(env),
    host: "127.0.0.1",
    port: 0,
    dataFile: join(dataDir, "xspresso-test.json")
  };

  const runtime = createXspressoEmailNotificationRuntime({
    env,
    config,
    fetchImpl: fakeOpenAIFetch
  });

  try {
    const address = await runtime.listen();
    const origin = `http://127.0.0.1:${address.port}`;

    const signup = await jsonRequest(origin, "/api/auth/signup", {
      method: "POST",
      body: {
        email: "workflow@example.test",
        password: "A-long-test-password-2026",
        name: "Workflow Test"
      }
    });

    assert.ok(signup.response.status < 300, JSON.stringify(signup.body));
    const token = signup.body.token;
    assert.ok(token);

    const created = await jsonRequest(origin, "/api/campaigns", {
      method: "POST",
      token,
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

    assert.ok(created.response.status < 300, JSON.stringify(created.body));
    const campaignId = created.body.campaign.id;

    const generated = await jsonRequest(
      origin,
      `/api/campaigns/${campaignId}/generate`,
      {
        method: "POST",
        token,
        idempotencyKey: "workflow-generation-0001",
        body: { notes: "Keep it practical and concise." }
      }
    );

    assert.ok(generated.response.status < 300, JSON.stringify(generated.body));

    const current = await jsonRequest(
      origin,
      `/api/campaigns/${campaignId}/draft`,
      { token }
    );

    assert.ok(current.response.status < 300);
    const baseVersion = current.body.version;
    const originalHeadline = current.body.draft.headline;

    const proposed = await jsonRequest(
      origin,
      `/api/campaigns/${campaignId}/proposals`,
      {
        method: "POST",
        token,
        idempotencyKey: "workflow-iteration-0001",
        body: {
          feedback: "Make it more focused and less generic.",
          baseVersion
        }
      }
    );

    assert.ok(proposed.response.status < 300, JSON.stringify(proposed.body));
    const proposal = proposed.body.proposal;
    assert.ok(proposal?.id);
    assert.notEqual(proposal.draft.headline, originalHeadline);

    // Proposing a revision must not overwrite the active draft.
    const unchanged = await jsonRequest(
      origin,
      `/api/campaigns/${campaignId}/draft`,
      { token }
    );
    assert.equal(unchanged.body.draft.headline, originalHeadline);
    assert.equal(unchanged.body.version, baseVersion);

    const applied = await jsonRequest(
      origin,
      `/api/campaigns/${campaignId}/proposals/${proposal.id}/apply`,
      {
        method: "POST",
        token,
        body: { expectedVersion: baseVersion }
      }
    );
    assert.ok(applied.response.status < 300, JSON.stringify(applied.body));

    const revised = await jsonRequest(
      origin,
      `/api/campaigns/${campaignId}/draft`,
      { token }
    );
    assert.equal(revised.body.draft.headline, proposal.draft.headline);
    assert.ok(revised.body.version > baseVersion);

    const approved = await jsonRequest(
      origin,
      `/api/campaigns/${campaignId}/approve`,
      {
        method: "POST",
        token,
        body: { expectedVersion: revised.body.version }
      }
    );
    assert.ok(approved.response.status < 300, JSON.stringify(approved.body));

    const exported = await jsonRequest(
      origin,
      `/api/campaigns/${campaignId}/export/approved`,
      { token }
    );
    assert.ok(exported.response.status < 300, JSON.stringify(exported.body));
    assert.equal(exported.body.campaign.id, campaignId);
    assert.equal(
      exported.body.creative.headline,
      proposal.draft.headline
    );

    const finalCampaign = await jsonRequest(
      origin,
      `/api/campaigns/${campaignId}`,
      { token }
    );
    assert.ok(finalCampaign.response.status < 300);
    assert.equal(finalCampaign.body.campaign.status, "draft");
    assert.equal(modelCalls, 2);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});
