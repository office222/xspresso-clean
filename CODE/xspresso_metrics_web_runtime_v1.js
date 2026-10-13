import { createServer } from 'node:http';
import { createXspressoEmailRuntime } from './xspresso_email_openai_runtime_v1.js';
import { createStaticWebHandler } from './xspresso_static_web_handler_v1.js';
import { createOperationsApiHandler } from './xspresso_operations_api_handler_v1.js';
import { createCampaignMetricsImportApiHandler } from './xspresso_campaign_metrics_import_api_v1.js';
import { CampaignMetricsImportService } from './xspresso_campaign_metrics_import_service_v1.js';
import { ImportedCsvMetricsProvider } from './xspresso_imported_metrics_provider_v1.js';
import { AlertRepository } from './xspresso_alert_repository_v1.js';
import { MonitoringWorker } from './xspresso_monitoring_worker_v1.js';
import { evaluateAdMetrics } from './xspresso_monitoring_rule_engine_v1.js';
import { AuthRateLimiter } from './xspresso_auth_rate_limiter_v1.js';

function safeHeaders(res) {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  res.setHeader('x-frame-options', 'DENY');
}
function json(res, status, value) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(value)); }

export function createXspressoMetricsWebRuntime(options = {}) {
  const emailRuntime = createXspressoEmailRuntime(options);
  const store = emailRuntime.store;
  const metricsProvider = new ImportedCsvMetricsProvider({ store });
  const importService = new CampaignMetricsImportService({ store });
  const alertRepository = new AlertRepository({ store });
  const monitoringWorker = new MonitoringWorker({
    store, metricsProvider, alertRepository,
    ruleEngine: { evaluateAdMetrics }
  });
  let api = createCampaignMetricsImportApiHandler({
    auth: emailRuntime.auth, importService, metricsProvider,
    fallback: emailRuntime.api,
    bodyLimitBytes: options.config?.bodyLimitBytes
  });
  api = createOperationsApiHandler({
    auth: emailRuntime.auth, monitoringWorker, alertRepository,
    followups: emailRuntime.followups, fallback: api,
    bodyLimitBytes: options.config?.bodyLimitBytes
  });
  const webHandler = createStaticWebHandler({ api, webRoot: options.webRoot });
  const limiter = new AuthRateLimiter({ maxAttempts: 12, windowMs: 60_000 });
  const server = createServer((req, res) => {
    safeHeaders(res);
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    if (req.method === 'POST' && /^\/api\/auth\/(?:signup|register|login)$/.test(path)) {
      const decision = limiter.consume(req.socket?.remoteAddress || 'unknown');
      if (!decision.allowed) {
        res.setHeader('retry-after', String(decision.retryAfterSeconds));
        return json(res, 429, { error: 'Too many authentication attempts. Try again later.', code: 'RATE_LIMITED' });
      }
    }
    Promise.resolve(webHandler(req, res)).catch(() => {
      if (!res.headersSent) json(res, 500, { error: 'Internal server error.', code: 'INTERNAL_ERROR' });
      else res.destroy();
    });
  });
  let listening = false;
  return {
    ...emailRuntime, server, api, metricsProvider, importService, alertRepository, monitoringWorker,
    async listen() {
      await store.init();
      if (listening) return server.address();
      const address = await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(options.config?.port, options.config?.host, () => {
          server.off('error', reject); listening = true; resolve(server.address());
        });
      });
      emailRuntime.scheduler?.start();
      return address;
    },
    async close() {
      if (listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      listening = false;
      await emailRuntime.close();
      await emailRuntime.mailer?.close?.();
    }
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const runtime = createXspressoMetricsWebRuntime();
  runtime.listen().then(address => console.log(`Xspresso metrics web runtime listening on ${typeof address === 'object' ? `${address.address}:${address.port}` : address}`))
    .catch(error => { console.error('Xspresso failed to start:', error.message); process.exitCode = 1; });
  const stop = () => runtime.close().finally(() => process.exit(0));
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
