import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createXspressoMetricsWebRuntime } from "./xspresso_metrics_web_runtime_v1.js";
import { createXspressoStaticHandlerV3 } from "./xspresso_static_web_handler_v3.js";
import { AuthRateLimiter } from "./xspresso_auth_rate_limiter_v1.js";
function sendJson(res, status, payload, headers = {}) { const text = JSON.stringify(payload); res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(text), "Cache-Control": "no-store", ...headers }); res.end(text); }
export function createXspressoMetricsDashboardRuntimeV3(options = {}) {
 const backend = createXspressoMetricsWebRuntime(options), handler = createXspressoStaticHandlerV3({ api: backend.api, webRoot: options.webRoot }), config = options.config || backend.config;
 const limiter = new AuthRateLimiter({ maxAttempts: 12, windowMs: 60_000 });
 const server = createServer((req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("X-Frame-Options", "DENY");
  const path = new URL(req.url || "/", "http://localhost").pathname;
  if (req.method === "POST" && ["/api/auth/login", "/api/auth/signup", "/api/auth/register"].includes(path)) { const r = limiter.consume(req.socket?.remoteAddress || "unknown"); if (!r.allowed) return sendJson(res, 429, { error: "Too many authentication attempts", code: "RATE_LIMITED" }, { "Retry-After": String(r.retryAfterSeconds) }); }
  Promise.resolve(handler(req, res)).catch((error) => { if (res.headersSent) return res.destroy(error); sendJson(res, Number.isInteger(error?.status) ? error.status : 500, { error: error?.status ? error.message : "Internal server error", code: error?.code || "INTERNAL_ERROR" }); });
 });
 let listening = false;
 return { ...backend, server, async listen() { await backend.store.init(); const address = await new Promise((resolveListen, reject) => { const onError = (e) => { server.off("listening", onListening); reject(e); }; const onListening = () => { server.off("error", onError); resolveListen(server.address()); }; server.once("error", onError); server.once("listening", onListening); server.listen(config.port, config.host); }); listening = true; backend.scheduler?.start?.(); return address; }, async close() { backend.scheduler?.stop && await backend.scheduler.stop(); if (listening) await new Promise((resolveClose, reject) => server.close((e) => e ? reject(e) : resolveClose())); listening = false; await backend.close?.(); await backend.mailer?.close?.(); } };
}
async function main() { const runtime = createXspressoMetricsDashboardRuntimeV3(), address = await runtime.listen(); console.log(`Xspresso metrics dashboard on ${address.address}:${address.port}`); const shutdown = async () => { await runtime.close(); process.exit(0); }; process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown); }
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((e) => { console.error("Dashboard startup failed:", e.message); process.exitCode = 1; });
