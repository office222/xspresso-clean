import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createXspressoRuntimeV2 } from './xspresso_runtime_server_v2.js';
import { createStaticWebHandler } from './xspresso_static_web_handler_v1.js';
import { AuthRateLimiter } from './xspresso_auth_rate_limiter_v1.js';
import { loadConfig } from './xspresso_config_v1.js';

/** Single-origin dashboard + API runtime. Provider integrations are passed explicitly. */
export function createXspressoWebRuntime({ config = loadConfig(), integrations = {}, store, auth, webRoot, rateLimiter = new AuthRateLimiter() } = {}) {
  const backend = createXspressoRuntimeV2({ config, integrations, store, auth });
  const webHandler = createStaticWebHandler({ api: backend.api, webRoot });
  const server = createServer((req, res) => {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    res.setHeader('x-frame-options', 'DENY');
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    if (req.method === 'POST' && ['/api/auth/login','/api/auth/signup','/api/auth/register'].includes(pathname)) {
      const decision = rateLimiter.consume(req.socket?.remoteAddress || 'unknown');
      if (!decision.allowed) {
        res.setHeader('retry-after', String(decision.retryAfterSeconds));
        const body = JSON.stringify({ error:'RATE_LIMITED', message:'Too many sign-in attempts. Try again shortly.' });
        res.writeHead(429, { 'content-type':'application/json; charset=utf-8', 'content-length':Buffer.byteLength(body), 'cache-control':'no-store' });
        res.end(body); return;
      }
    }
    Promise.resolve(webHandler(req,res)).catch(() => {
      if (res.headersSent) return res.destroy();
      const body = JSON.stringify({ error:'INTERNAL_ERROR', message:'The request could not be completed.' });
      res.writeHead(500, { 'content-type':'application/json; charset=utf-8', 'content-length':Buffer.byteLength(body), 'cache-control':'no-store' });
      res.end(body);
    });
  });
  let listening = false;
  return {
    ...backend, server,
    async listen() {
      await backend.store.init();
      if (listening) return server.address();
      await new Promise((resolveListen,reject) => {
        const onError = error => { server.off('listening',onListening); reject(error); };
        const onListening = () => { server.off('error',onError); resolveListen(); };
        server.once('error',onError); server.once('listening',onListening); server.listen(config.port,config.host);
      });
      listening = true;
      if (typeof integrations.scheduler?.start === 'function') integrations.scheduler.start();
      return server.address();
    },
    async close() {
      if (typeof integrations.scheduler?.stop === 'function') await integrations.scheduler.stop();
      if (listening) await new Promise((resolveClose,reject) => server.close(error => error ? reject(error) : resolveClose()));
      listening = false;
      await backend.store.flush();
    }
  };
}

async function main() {
  const runtime = createXspressoWebRuntime();
  const address = await runtime.listen();
  console.log(`Xspresso is ready at http://${address.address}:${address.port}`);
  const shutdown = async () => { await runtime.close(); process.exit(0); };
  process.once('SIGINT',shutdown); process.once('SIGTERM',shutdown);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error('Xspresso failed to start:',error.message); process.exitCode=1; });
}
