import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadConfig } from './xspresso_config_v1.js';
import { JsonStore } from './xspresso_json_store_v1.js';
import { CreditLedgerService } from './xspresso_credit_ledger_service_v1.js';
import { CampaignGenerationService } from './xspresso_campaign_generation_service_v1.js';
import { createOpenAIProviderFromEnv } from './xspresso_openai_responses_provider_v1.js';
import { createXspressoWebRuntime } from './xspresso_web_runtime_v1.js';

/** Web runtime with server-side OpenAI generation; all credentials remain in env. */
export function createOpenAIEnabledWebRuntime({ env = process.env, config = loadConfig(env), fetchImpl = globalThis.fetch } = {}) {
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
        throw Object.assign(new Error('AI generation is not configured. Set OPENAI_API_KEY and OPENAI_MODEL on the server.'), {
          code: 'AI_PROVIDER_NOT_CONFIGURED', status: 503
        });
      }
    };
  }
  return createXspressoWebRuntime({ config, store, integrations: { generation } });
}

function parseCreditCost(value, nodeEnv) {
  if (value === undefined || value === '') {
    if (nodeEnv === 'production') throw new Error('Set XSPRESSO_GENERATION_CREDIT_COST explicitly when enabling the AI provider in production.');
    return 0;
  }
  const cost = Number(value);
  if (!Number.isSafeInteger(cost) || cost < 0 || cost > 1_000_000) throw new Error('XSPRESSO_GENERATION_CREDIT_COST must be an integer from 0 to 1000000.');
  return cost;
}

async function main() {
  const runtime = createOpenAIEnabledWebRuntime();
  const address = await runtime.listen();
  console.log(`Xspresso is ready at http://${address.address}:${address.port}`);
  const shutdown = async () => { await runtime.close(); process.exit(0); };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error('Xspresso failed to start:', error.message); process.exitCode = 1; });
}
