import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createXspressoMetaOAuthRuntime } from "./xspresso_meta_oauth_runtime_v1.js";
import { createXspressoStaticMetaConnectionHandler } from "./xspresso_static_meta_connection_v1.js";
import { AuthRateLimiter } from "./xspresso_auth_rate_limiter_v1.js";

/** Serves the main dashboard plus the Meta account-connect panel. */
export function createXspressoMetaDashboardRuntime(options = {}) {
  const backend = createXspressoMetaOAuthRuntime(options);
  const config = options.config || backend.config;
  const apiAndOauth = backend.api;
  const webHandler = createXspressoStaticMetaConnectionHandler({ api: apiAndOauth, webRoot: options.webRoot });
  const limiter = new AuthRateLimiter({ maxAttempts: 12, windowMs: 60_000 });
  const server = createServer((req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    const path = new URL(req.url || "/", "http://localhost").pathname;
    if (req.method === "POST" && ["/api/auth/login", "/api/auth/signup", "/api/auth/register", "/api/integrations/meta/connect"].includes(path)) {
      const result = limiter.consume(req.socket?.remoteAddress || "unknown");
      if (!result.allowed) { const body = JSON.stringify({ error: "RATE_LIMITED", message: "Too many requests. Try again shortly." }); res.writeHead(429, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store", "retry-after": String(result.retryAfterSeconds) }); return res.end(body); }
    }
    Promise.resolve(webHandler(req, res)).catch(error => {
      if (res.headersSent) return res.destroy(error);
      const status = Number.isInteger(error?.status) ? error.status : 500;
      const body = JSON.stringify({ error: error?.code || "INTERNAL_ERROR", message: status >= 500 ? "The request could not be completed." : error.message });
      res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store" }); res.end(body);
    });
  });
  let listening = false;
  return {
    ...backend, server,
    async listen() {
      await backend.store.init();
      const address = await new Promise((resolveAddress, reject) => {
        const onError = error => { server.off("listening", onListening); reject(error); };
        const onListening = () => { server.off("error", onError); resolveAddress(server.address()); };
        server.once("error", onError); server.once("listening", onListening); server.listen(config.port, config.host);
      });
      listening = true; backend.scheduler?.start?.(); return address;
    },
    async close() {
      await backend.scheduler?.stop?.();
      if (listening) await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
      listening = false; await backend.close?.(); await backend.mailer?.close?.();
    }
  };
}
async function main() {
  const runtime = createXspressoMetaDashboardRuntime(); const address = await runtime.listen();
  console.log(`Xspresso dashboard listening on ${address.address}:${address.port}`);
  const stop = async () => { await runtime.close(); process.exit(0); };
  process.once("SIGINT", stop); process.once("SIGTERM", stop);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error("Xspresso startup failed:", error.message); process.exitCode = 1; });