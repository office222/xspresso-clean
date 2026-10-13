import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createXspressoMetaOAuthRuntime } from './xspresso_meta_oauth_runtime_v1.js';
import { createXspressoMetaConnectionStaticHandler } from './xspresso_static_meta_connection_v2.js';
import { AuthRateLimiter } from './xspresso_auth_rate_limiter_v1.js';

export function createXspressoMetaDashboardRuntime(options = {}) {
  const backend = createXspressoMetaOAuthRuntime(options);
  const config = options.config || backend.config;
  if (!config) throw new Error('Runtime configuration is unavailable.');
  const webHandler = createXspressoMetaConnectionStaticHandler({ api: backend.api, webRoot: options.webRoot });
  const limiter = new AuthRateLimiter({ maxAttempts: 12, windowMs: 60_000 });
  const server = createServer((req, res) => {
    for (const [key,value] of Object.entries({
      'x-content-type-options':'nosniff',
      'referrer-policy':'strict-origin-when-cross-origin',
      'x-frame-options':'DENY',
      'cache-control':'no-store',
    })) res.setHeader(key,value);
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    const authSensitive = req.method === 'POST' && [
      '/api/auth/login','/api/auth/signup','/api/auth/register','/api/integrations/meta/connect',
    ].includes(pathname);
    if (authSensitive) {
      const key = req.socket?.remoteAddress || 'unknown';
      const decision = limiter.consume(key);
      if (!decision.allowed) {
        res.writeHead(429, { 'content-type':'application/json; charset=utf-8', 'retry-after':String(decision.retryAfterSeconds || 60) });
        return res.end(JSON.stringify({ error:'Too many requests. Try again shortly.', code:'RATE_LIMITED' }));
      }
    }
    Promise.resolve(webHandler(req,res)).catch(() => {
      if (!res.headersSent) res.writeHead(500, { 'content-type':'application/json; charset=utf-8' });
      if (!res.writableEnded) res.end(JSON.stringify({ error:'Internal server error.' }));
    });
  });
  let listening = false;
  return {
    ...backend,
    server,
    async listen() {
      await backend.store.init();
      if (listening) return server.address();
      await new Promise((resolveListen,reject) => {
        server.once('error',reject);
        server.listen(config.port,config.host,() => { server.off('error',reject); resolveListen(); });
      });
      listening = true;
      backend.scheduler?.start?.();
      return server.address();
    },
    async close() {
      backend.scheduler?.stop && await backend.scheduler.stop();
      if (listening) await new Promise((resolveClose,reject) => server.close(error => error ? reject(error) : resolveClose()));
      listening = false;
      await backend.close?.();
      await backend.mailer?.close?.();
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const runtime = createXspressoMetaDashboardRuntime();
  runtime.listen().then(address => console.log(`Xspresso dashboard listening on ${address.address}:${address.port}`))
    .catch(error => { console.error('Xspresso startup failed:', error.message); process.exitCode = 1; });
}
