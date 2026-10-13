import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { AuthService } from './xspresso_auth_service_v1.js';
import { loadConfig } from './xspresso_config_v1.js';
import { createCoreApiHandler } from './xspresso_core_api_v2.js';
import { JsonStore } from './xspresso_json_store_v1.js';
import { CampaignReviewService } from './xspresso_campaign_review_service_v1.js';
import { composeXspressoApiV2 } from './xspresso_app_composition_v2.js';
import { AuthRateLimiter } from './xspresso_auth_rate_limiter_v1.js';

/** Runnable single-process API; external AI, email, and ad providers are explicitly injected. */
export function createXspressoRuntimeV2({ config = loadConfig(), store = new JsonStore({ filePath: config.dataFile }), auth, integrations = {}, rateLimiter = new AuthRateLimiter() } = {}) {
  const authService = auth || new AuthService({ store, sessionTtlMs: config.sessionTtlMs });
  const reviewService = integrations.reviewService || new CampaignReviewService({ store });
  const baseApi = createCoreApiHandler({ store, auth: authService, config });
  const api = composeXspressoApiV2({
    baseApi, auth: authService, reviewService,
    generation: integrations.generation, monitoringWorker: integrations.monitoringWorker,
    alertRepository: integrations.alertRepository, followups: integrations.followups,
    unsubscribeService: integrations.unsubscribeService, tokenService: integrations.tokenService,
    bodyLimitBytes: config.bodyLimitBytes
  });

  const server = createServer((req, res) => {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    res.setHeader('x-frame-options', 'DENY');
    const url = new URL(req.url || '/', 'http://localhost');
    if (req.method === 'POST' && ['/api/auth/login', '/api/auth/signup', '/api/auth/register'].includes(url.pathname)) {
      const decision = rateLimiter.consume(req.socket?.remoteAddress || 'unknown');
      if (!decision.allowed) {
        res.setHeader('retry-after', String(decision.retryAfterSeconds));
        const payload = JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again shortly.' });
        res.writeHead(429, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload), 'cache-control': 'no-store' });
        res.end(payload); return;
      }
    }
    Promise.resolve(api(req, res)).catch(() => {
      if (res.headersSent) return res.destroy();
      const payload = JSON.stringify({ error: 'INTERNAL_ERROR', message: 'The request could not be completed.' });
      res.writeHead(500, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload), 'cache-control': 'no-store' });
      res.end(payload);
    });
  });

  let listening = false;
  return {
    config, store, auth: authService, reviewService, api, server,
    async listen() {
      await store.init();
      if (listening) return server.address();
      await new Promise((resolveListen, reject) => {
        const onError = error => { server.off('listening', onListening); reject(error); };
        const onListening = () => { server.off('error', onError); resolveListen(); };
        server.once('error', onError); server.once('listening', onListening); server.listen(config.port, config.host);
      });
      listening = true;
      if (typeof integrations.scheduler?.start === 'function') integrations.scheduler.start();
      return server.address();
    },
    async close() {
      if (typeof integrations.scheduler?.stop === 'function') await integrations.scheduler.stop();
      if (listening) await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
      listening = false;
      await store.flush();
    }
  };
}

async function main() {
  const runtime = createXspressoRuntimeV2();
  const address = await runtime.listen();
  console.log(`Xspresso API listening on http://${address.address}:${address.port}`);
  const shutdown = async () => { await runtime.close(); process.exit(0); };
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error('Xspresso failed to start:', error.message); process.exitCode = 1; });
}
