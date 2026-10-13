import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadConfig } from './xspresso_config_v1.js';
import { JsonStore } from './xspresso_json_store_v1.js';
import { CreditLedgerService } from './xspresso_credit_ledger_service_v1.js';
import { CampaignGenerationService } from './xspresso_campaign_generation_service_v1.js';
import { createOpenAIProviderFromEnv } from './xspresso_openai_responses_provider_v1.js';
import { createXspressoWebRuntime } from './xspresso_web_runtime_v1.js';
import { FollowupSequenceService } from './xspresso_followup_sequence_service_v2.js';
import { FollowupDeliveryWorker } from './xspresso_followup_delivery_worker_v3.js';
import { UnsubscribeTokenService } from './xspresso_unsubscribe_tokens_v1.js';
import { UnsubscribeService } from './xspresso_unsubscribe_service_v1.js';
import { createSmtpMailerFromEnv } from './xspresso_smtp_mailer_adapter_v1.js';
import { XspressoFollowupScheduler } from './xspresso_followup_scheduler_v2.js';

/** OpenAI + optional SMTP follow-up runtime. Credentials remain server-side. */
export function createXspressoEmailRuntime({ env = process.env, config = loadConfig(env), fetchImpl = globalThis.fetch, nodemailerModule } = {}) {
  const store = new JsonStore({ filePath: config.dataFile });
  const credits = new CreditLedgerService({ store });
  const provider = createOpenAIProviderFromEnv(env, { fetchImpl });
  let generation;
  if (provider) {
    const creditCost = parseCreditCost(env.XSPRESSO_GENERATION_CREDIT_COST, config.nodeEnv);
    generation = new CampaignGenerationService({ store, credits, provider, creditCost });
  } else {
    generation = {
      async generate() {
        throw Object.assign(new Error('AI generation is not configured. Set OPENAI_API_KEY and OPENAI_MODEL on the server.'), { code: 'AI_PROVIDER_NOT_CONFIGURED', status: 503 });
      }
    };
  }

  const mailer = createSmtpMailerFromEnv(env, nodemailerModule ? { nodemailerModule } : {});
  const integrations = { generation };
  let followups;
  let followupWorker;
  let scheduler;
  let unsubscribeTokens;
  let unsubscribeService;

  if (mailer) {
    const signingSecret = String(env.XSPRESSO_UNSUBSCRIBE_SECRET || '');
    if (Buffer.byteLength(signingSecret) < 32) throw new Error('SMTP is enabled, so XSPRESSO_UNSUBSCRIBE_SECRET must be at least 32 bytes.');
    const publicBaseUrl = resolvePublicBaseUrl(env, config);
    unsubscribeTokens = new UnsubscribeTokenService({ signingSecret });
    unsubscribeService = new UnsubscribeService({ store, tokenService: unsubscribeTokens });
    followups = new FollowupSequenceService({ store });
    followupWorker = new FollowupDeliveryWorker({ store, mailer, unsubscribeTokens, publicBaseUrl });
    scheduler = new XspressoFollowupScheduler({
      worker: followupWorker,
      intervalMs: parseInteger(env.XSPRESSO_FOLLOWUP_INTERVAL_MS, 30_000, 1000, 3_600_000),
      maxPerCycle: parseInteger(env.XSPRESSO_FOLLOWUP_MAX_PER_CYCLE, 25, 1, 500)
    });
    integrations.followups = followups;
    integrations.unsubscribeService = unsubscribeService;
    integrations.tokenService = unsubscribeTokens;
    integrations.scheduler = scheduler;
  } else {
    // Keep the API explicit: enrollment reports a configuration error instead of silently queueing mail.
    integrations.followups = {
      async enroll() {
        throw Object.assign(new Error('SMTP follow-up delivery is not configured.'), { code: 'EMAIL_PROVIDER_NOT_CONFIGURED', status: 503 });
      }
    };
  }

  const runtime = createXspressoWebRuntime({ config, store, integrations });
  return { ...runtime, emailConfigured: Boolean(mailer), mailer, followups, followupWorker, scheduler, unsubscribeTokens, unsubscribeService };
}

function resolvePublicBaseUrl(env, config) {
  const raw = String(env.XSPRESSO_PUBLIC_BASE_URL || (config.nodeEnv === 'production' ? '' : `http://localhost:${config.port}`)).trim();
  let url;
  try { url = new URL(raw); } catch { throw new Error('Set XSPRESSO_PUBLIC_BASE_URL to an absolute public HTTP(S) URL when SMTP is enabled.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('XSPRESSO_PUBLIC_BASE_URL must use HTTP or HTTPS.');
  if (config.nodeEnv === 'production' && url.protocol !== 'https:') throw new Error('XSPRESSO_PUBLIC_BASE_URL must use HTTPS in production.');
  return url.toString();
}
function parseCreditCost(value, nodeEnv) {
  if (value === undefined || value === '') {
    if (nodeEnv === 'production') throw new Error('Set XSPRESSO_GENERATION_CREDIT_COST explicitly when enabling AI in production.');
    return 0;
  }
  return parseInteger(value, 0, 0, 1_000_000);
}
function parseInteger(value, fallback, min, max) {
  if (value === undefined || value === '') return fallback;
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < min || result > max) throw new Error(`Expected an integer from ${min} to ${max}.`);
  return result;
}

async function main() {
  const runtime = createXspressoEmailRuntime();
  const address = await runtime.listen();
  console.log(`Xspresso is ready at http://${address.address}:${address.port}`);
  console.log(`SMTP follow-ups: ${runtime.emailConfigured ? 'enabled' : 'not configured'}`);
  const shutdown = async () => { await runtime.close(); await runtime.mailer?.close(); process.exit(0); };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error('Xspresso failed to start:', error.message); process.exitCode = 1; });
}
