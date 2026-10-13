import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createXspressoMetricsWebRuntime } from "./xspresso_metrics_web_runtime_v1.js";
import { createXspressoStaticHandlerV2 } from "./xspresso_static_web_handler_v2.js";
import { AuthRateLimiter } from "./xspresso_auth_rate_limiter_v1.js";

function json(res, status, body, headers = {}) { const text = JSON.stringify(body); res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(text), "Cache-Control": "no-store", ...headers }); res.end(text); }
export function createXspressoMetricsDashboardRuntime(options = {}) {
  const backend = createXspressoMetricsWebRuntime(options);
  const web = createXspressoStaticHandlerV2({ api: backend.api, webRoot: options.webRoot });
  const config = options.config || backend.config;
  const limiter = new AuthRateLimiter({ maxAttempts: 12, windowMs: 60_000 });
  const server = createServer((req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    const path = new URL(req.url || "/", "http://localhost").pathname;
    if (req.method === "POST" && ["/api/auth/login", "/api/auth/signup", "/api/auth/register"].includes(path)) {
      const decision = limiter.consume(req.socket?.remoteAddress || "unknown");
      if (!decision.allowed) return json(res, 429, { error: "Too many authentication attempts", code: "RATE_LIMITED" }, { "Retry-After": String(decision.retryAfterSeconds) });
    }
    Promise.resolve(web(req, res)).catch((error) => {
      if (res.headersSent) return res.destroy(error);
      json(res, Number.isInteger(error?.status) ? error.status : 500, { error: error?.status ? error.message : "Internal server error", code: error?.code || "INTERNAL_ERROR" });
    });
  });
  let listening = false;
  return {
    ...backend, api: backend.api, server,
    async listen() {
      await backend.store.init();
      const address = await new Promise((resolveListen, reject) => {
        const onError = (e) => { server.off("listening", onListening); reject(e); };
        const onListening = () => { server.off("error", onError); resolveListen(server.address()); };
        server.once("error", onError); server.once("listening", onListening);
        server.listen(config.port, config.host);
      });
      listening = true;
      backend.scheduler?.start?.();
      return address;
    },
    async close() {
      backend.scheduler?.stop && await backend.scheduler.stop();
      if (listening) await new Promise((resolveClose, reject) => server.close((e) => e ? reject(e) : resolveClose()));
      listening = false;
      await backend.close?.();
      await backend.mailer?.close?.();
    },
  };
}

async function main() {
  const runtime = createXspressoMetricsDashboardRuntime();
  const address = await runtime.listen();
  console.log(`Xspresso dashboard listening on ${typeof address === "object" && address ? address.address + ":" + address.port : String(address)}`);
  const shutdown = async () => { await runtime.close(); process.exit(0); };
  process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error("Xspresso dashboard failed to start:", error.message); process.exitCode = 1; });
}
