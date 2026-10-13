import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createXspressoMetaMetricsRuntime } from './xspresso_meta_metrics_runtime_v1.js';
import { MetaOAuthService } from './xspresso_meta_oauth_service_v1.js';
import { createMetaOAuthApiHandler } from './xspresso_meta_oauth_api_v1.js';
import { createXspressoStaticHandlerV3_1 } from './xspresso_static_web_handler_v3_1.js';
import { AuthRateLimiter } from './xspresso_auth_rate_limiter_v1.js';

/** Meta metrics runtime plus authenticated OAuth connect/status/disconnect routes. */
export function createXspressoMetaOAuthRuntime(options = {}) {
  const backend = createXspressoMetaMetricsRuntime(options);
  const env = options.env || process.env;
  const config = options.config || backend.config;
  const vault = backend.tokenVault;
  const hasOAuthConfig = Boolean(env.XSPRESSO_META_APP_ID && env.XSPRESSO_META_APP_SECRET && env.XSPRESSO_META_REDIRECT_URI && env.XSPRESSO_META_GRAPH_API_VERSION);
  const oauthService = vault && hasOAuthConfig ? new MetaOAuthService({
    store: backend.store, vault, appId: env.XSPRESSO_META_APP_ID, appSecret: env.XSPRESSO_META_APP_SECRET,
    redirectUri: env.XSPRESSO_META_REDIRECT_URI, graphApiVersion: env.XSPRESSO_META_GRAPH_API_VERSION,
    fetchImpl: options.fetchImpl
  }) : null;
  const api = createMetaOAuthApiHandler({ auth: backend.auth, oauthService, vault, fallback: backend.api });
  const webHandler = createXspressoStaticHandlerV3_1({ api, webRoot: options.webRoot });
  const limiter = new AuthRateLimiter({ maxAttempts: 12, windowMs: 60_000 });
  const server = createServer((req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY');
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    if (req.method === 'POST' && ['/api/auth/login', '/api/auth/signup', '/api/auth/register', '/api/integrations/meta/connect'].includes(path)) {
      const decision = limiter.consume(req.socket?.remoteAddress || 'unknown');
      if (!decision.allowed) { const body = JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }); res.writeHead(429, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store', 'retry-after': String(decision.retryAfterSeconds) }); return res.end(body); }
    }
    Promise.resolve(webHandler(req, res)).catch(error => {
      if (res.headersSent) return res.destroy(error);
      const status = Number.isInteger(error?.status) ? error.status : 500;
      const body = JSON.stringify({ error: error?.code || 'INTERNAL_ERROR', message: status >= 500 ? 'The request could not be completed.' : error.message });
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store' }); res.end(body);
    });
  });
  let listening = false;
  return {
    ...backend, api, server, oauthService, oauthConfigured: Boolean(oauthService),
    async listen() {
      await backend.store.init();
      const address = await new Promise((resolveAddress, reject) => {
        const onError = error => { server.off('listening', onListening); reject(error); };
        const onListening = () => { server.off('error', onError); resolveAddress(server.address()); };
        server.once('error', onError); server.once('listening', onListening); server.listen(config.port, config.host);
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
  const runtime = createXspressoMetaOAuthRuntime(); const address = await runtime.listen();
  console.log(`Xspresso Meta OAuth runtime listening on ${address.address}:${address.port}`);
  console.log(`Meta OAuth: ${runtime.oauthConfigured ? 'configured' : 'not configured; add Meta app settings and encryption key'}`);
  const stop = async () => { await runtime.close(); process.exit(0); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error('Xspresso startup failed:', error.message); process.exitCode = 1; });
