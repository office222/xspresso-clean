import { createServer } from 'node:http';
import { loadConfig } from './xspresso_config.js';
import { JsonStore } from './xspresso_json_store.js';
import { AuthService } from './xspresso_auth.js';
import { LeadService } from './xspresso_lead_service_v1.js';
import { CreditLedgerService } from './xspresso_credit_ledger_service_v1.js';
import { MetricsService } from './xspresso_metrics_service_v1.js';
import { SettingsService } from './xspresso_settings_service_v1.js';
import { createApiHandler } from './xspresso_api_routes_v2.js';
import { applySecurityHeaders, createRateLimiter } from './xspresso_request_security_v1.js';

const config = loadConfig();
const store = new JsonStore(config.dataFile);
await store.init();
const auth = new AuthService({ store, sessionTtlMs: config.sessionTtlMs });
const services = {
  leads: new LeadService({ store }),
  credits: new CreditLedgerService({ store }),
  metrics: new MetricsService({ store }),
  settings: new SettingsService({ store })
};
const api = createApiHandler({ store, auth, config, services });
const limitRequest = createRateLimiter({ windowMs: 60_000, maxRequests: 120 });

const server = createServer(async (req, res) => {
  const allowed = applySecurityHeaders(req, res, {
    allowedOrigin: config.allowedOrigin,
    production: process.env.NODE_ENV === 'production'
  });
  if (!allowed) {
    res.writeHead(403, { 'content-type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'ORIGIN_NOT_ALLOWED', message: 'Origin is not allowed.' }));
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (!req.url?.startsWith('/api/')) { res.writeHead(404); return res.end('Not found'); }

  const rate = limitRequest(req);
  res.setHeader('x-ratelimit-limit', String(rate.limit));
  res.setHeader('x-ratelimit-remaining', String(rate.remaining));
  res.setHeader('x-ratelimit-reset', rate.resetAt);
  if (!rate.allowed) {
    res.setHeader('retry-after', String(rate.retryAfterSeconds));
    res.writeHead(429, { 'content-type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }));
  }
  await api(req, res);
});

server.listen(config.port, () => {
  console.log(`Xspresso API v2 listening on http://localhost:${config.port}`);
  console.log(`Data file: ${config.dataFile}`);
  console.warn('Local MVP only: JSON persistence and in-memory auth sessions are not production infrastructure.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
