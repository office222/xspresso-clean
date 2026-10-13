import test from "node:test";
import assert from "node:assert/strict";
import { XspressoDashboardApi } from "./xspresso_dashboard_api_v2.js";

test("dashboard API sends authenticated external-link and CSV-import requests", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const api = new XspressoDashboardApi({ getToken: () => "test-session-token", fetchImpl });
  await api.linkExternal("campaign-1", { platform: "meta", externalCampaignId: "ad-123", confirmAlreadyLive: true });
  await api.importMetrics("campaign-1", "date,ad_id,impressions,clicks,spend,conversions,currency\n2026-10-09,ad-123,100,4,2.50,0,USD\n", "metrics-file-0001");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "/api/campaigns/campaign-1/link-external");
  assert.equal(calls[0].init.headers.Authorization, "Bearer test-session-token");
  assert.equal(calls[1].url, "/api/campaigns/campaign-1/metrics/import");
  assert.equal(calls[1].init.headers["Content-Type"], "text/csv");
  assert.equal(calls[1].init.headers["Idempotency-Key"], "metrics-file-0001");
  assert.match(calls[1].init.body, /^date,ad_id/);
});

test("dashboard API surfaces server errors without losing status and code", async () => {
  const api = new XspressoDashboardApi({ fetchImpl: async () => new Response(JSON.stringify({ error: "Import failed", code: "INVALID_CSV" }), { status: 400 }) });
  await assert.rejects(api.importMetrics("c1", "bad", "metrics-file-0002"), (error) => error.status === 400 && error.code === "INVALID_CSV");
});
