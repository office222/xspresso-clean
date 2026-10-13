import test from "node:test";
import assert from "node:assert/strict";
import { XspressoDashboardApiV3 } from "./xspresso_dashboard_api_client_v3.js";
test("v3 client sends authenticated metrics CSV import with idempotency key", async () => {
 const calls = [];
 const api = new XspressoDashboardApiV3({ getToken: () => "session", fetchImpl: async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ imported: 1 }), { status: 201 }); } });
 const csv = "date,ad_id,impressions,clicks,spend,conversions,currency\n2026-10-09,a1,100,4,2.50,0,USD\n";
 await api.importMetrics("campaign-1", csv, "import-key-0001");
 assert.equal(calls[0].url, "/api/campaigns/campaign-1/metrics/import");
 assert.equal(calls[0].init.headers.Authorization, "Bearer session");
 assert.equal(calls[0].init.headers["Content-Type"], "text/csv");
 assert.equal(calls[0].init.headers["Idempotency-Key"], "import-key-0001");
 assert.equal(calls[0].init.body, csv);
});
test("v3 client preserves API error code and HTTP status", async () => {
 const api = new XspressoDashboardApiV3({ fetchImpl: async () => new Response(JSON.stringify({ error: "Bad CSV", code: "INVALID_CSV" }), { status: 400 }) });
 await assert.rejects(api.importMetrics("campaign-1", "bad", "import-key-0002"), (error) => error.status === 400 && error.code === "INVALID_CSV");
});
