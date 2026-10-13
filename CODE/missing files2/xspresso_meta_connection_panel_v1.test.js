import test from "node:test";
import assert from "node:assert/strict";
import { createMetaConnectionApi } from "./xspresso_meta_connection_panel_v1.js";

test("Meta connection API sends session auth and never exposes tokens in request bodies", async () => {
  const calls = [];
  const api = createMetaConnectionApi({ getToken: () => "session-token-value", fetchImpl: async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(url.endsWith("/status") ? { connected: false, connections: [] } : { authorizationUrl: "https://www.facebook.com/oauth" }), { status: 200, headers: { "content-type": "application/json" } });
  } });
  await api.status();
  await api.connect({ adAccountId: "123456789", currency: "USD" });
  await api.disconnect();
  assert.equal(calls[0].init.headers.Authorization, "Bearer session-token-value");
  assert.equal(calls[1].init.method, "POST");
  assert.equal(calls[1].init.headers["Content-Type"], "application/json");
  assert.equal(JSON.parse(calls[1].init.body).adAccountId, "123456789");
  assert.equal(calls[2].init.method, "DELETE");
  assert.ok(calls.every(call => !String(call.url).includes("session-token-value")));
});

test("Meta connection API surfaces backend failures without swallowing status codes", async () => {
  const api = createMetaConnectionApi({ getToken: () => "session-token", fetchImpl: async () => new Response(JSON.stringify({ error: "META_OAUTH_NOT_CONFIGURED", message: "Meta OAuth is not configured." }), { status: 503 }) });
  await assert.rejects(api.status(), error => error.status === 503 && error.code === "META_OAUTH_NOT_CONFIGURED");
});