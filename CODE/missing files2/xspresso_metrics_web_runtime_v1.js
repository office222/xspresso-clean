import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createXspressoEmailRuntime } from './xspresso_email_openai_runtime_v1.js';
import { ImportedMetricsProvider } from './xspresso_imported_metrics_provider_v1.js';
import { CampaignMetricsImportService } from './xspresso_campaign_metrics_import_service_v1.js';
import { createCampaignMetricsImportApi, wrapMetricsAndMonitoringApi } from './xspresso_campaign_metrics_import_api_v1.js';
import { createStaticWebHandler } from './xspresso_static_web_handler_v1.js';
import { AuthRateLimiter } from './xspresso_auth_rate_limiter_v1.js';
import { MonitoringWorker } from './xspresso_monitoring_worker_v1.js';
import { evaluateAdMetrics } from './xspresso_monitoring_rule_engine_v1.js';
import { AlertRepository } from './xspresso_alert_repository_v1.js';

/** OpenAI/SMTP runtime plus CSV metrics import, monitoring, and alerts. */
export function createXspressoMetricsWebRuntime(options = {}) {
  const email = createXspressoEmailRuntime(options);
  const store = email.store;
  const metricsProvider = new ImportedMetricsProvider({ store });
  const importService = new CampaignMetricsImportService({ store });
  const alertRepository = new AlertRepository({ store });
  const monitoringWorker = new MonitoringWorker({ store, metricsProvider, ruleEngine: { evaluateAdMetrics }, alerts: alertRepository });

  // The existing email runtime's API already provides auth, campaigns, generation, review, and unsubscribe.
  const metricsApi = createCampaignMetricsImportApi({ auth: email.auth, importService, metricsProvider, fallback: email.api });
  const api = wrapMetricsAndMonitoringApi({
    baseApi: email.api, auth: email.auth, importService, metricsProvider, monitoringWorker,
    alertRepository, followups: email.followups
  });
  // wrapMetricsAndMonitoringApi includes its own CSV layer; keep the named layer above as a contract check.
  void metricsApi;

  const web = createStaticWebHandler({ api });
  const rateLimiter = new AuthRateLimiter({ maxAttempts: 12, windowMs: 60_000 });
  const server = createServer((req, res) => {
    for (const [name, value] of Object.entries({
      'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY', 'cache-control': 'no-store'
    })) res.setHeader(name, value);
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    if (req.method === 'POST' && ['/api/auth/login', '/api/auth/signup', '/api/auth/register'].includes(path)) {
      const decision = rateLimiter.consume(req.socket?.remoteAddress || 'unknown');
      if (!decision.allowed) { res.setHeader('retry-after', String(decision.retryAfterSeconds)); res.writeHead(429, { 'content-type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again shortly.' })); }
    }
    Promise.resolve(web(req, res)).catch(() => {
      if (!res.headersSent) { res.writeHead(500, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify({ error: 'INTERNAL_ERROR', message: 'The request could not be completed.' })); }
      else res.destroy();
    });
  });
  let listening = false;
  return {
    ...email, server, api, metricsProvider, importService, monitoringWorker, alertRepository,
    listen() {
      if (listening) return Promise.reject(new Error('Server is already listening.'));
      return email.store.init().then(() => new Promise((resolveListen, reject) => {
        const onError = error => { server.off('listening', onListening); reject(error); };
        const onListening = () => { server.off('error', onError); listening = true; email.scheduler?.start(); resolveListen(server.address()); };
        server.once('error', onError); server.once('listening', onListening); server.listen(email.config.port, email.config.host);
      }));
    },
    async close() {
      await email.scheduler?.stop();
      if (listening) await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
      listening = false;
      await email.close();
      await email.mailer?.close();
    }
  };
}

async function main() {
  const runtime = createXspressoMetricsWebRuntime();
  const address = await runtime.listen();
  console.log(`Xspresso is ready at http://${address.address}:${address.port}`);
  console.log('Metrics ingestion: CSV import for campaigns linked as already live; no ad publishing is performed.');
  const shutdown = async () => { await runtime.close(); process.exit(0); };
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error('Xspresso failed to start:', error.message); process.exitCode = 1; });
}
