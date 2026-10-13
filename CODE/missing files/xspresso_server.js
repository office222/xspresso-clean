/** Xspresso API entry point. Run: npm start (Node.js 20+). */
import { createServer } from 'node:http';
import { loadConfig } from './xspresso_config.js';
import { JsonStore } from './xspresso_json_store.js';
import { AuthService } from './xspresso_auth.js';
import { createApiHandler } from './xspresso_api_routes.js';

const config = loadConfig();
const store = new JsonStore(config.dataFile);
await store.init();
const auth = new AuthService({ store, sessionTtlMs: config.sessionTtlMs });
const api = createApiHandler({ store, auth, config });

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && origin !== config.allowedOrigin) {
    res.writeHead(403, { 'content-type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'ORIGIN_NOT_ALLOWED' }));
  }
  res.setHeader('access-control-allow-origin', config.allowedOrigin);
  res.setHeader('vary', 'Origin');
  res.setHeader('access-control-allow-methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'authorization,content-type');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('x-frame-options', 'DENY');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (!req.url?.startsWith('/api/')) { res.writeHead(404); return res.end('Not found'); }
  try {
    await api(req, res);
  } catch (error) {
    if (!res.headersSent) {
      const status = error.status || (error instanceof TypeError ? 400 : 500);
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ error: status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
        message: status >= 500 ? 'The server could not complete the request.' : error.message }));
    } else {
      res.destroy(error);
    }
    if (error.status >= 500 || !error.status) console.error('[xspresso-api]', error);
  }
});

server.listen(config.port, () => {
  console.log(`Xspresso API listening on http://localhost:${config.port}`);
  console.log(`Data file: ${config.dataFile}`);
  console.warn('Local MVP store only: use a transactional database and managed authentication before production.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
