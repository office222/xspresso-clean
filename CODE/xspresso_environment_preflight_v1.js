import { randomUUID } from 'node:crypto';
import { mkdir, open, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadConfig } from './xspresso_config_v1.js';
import { createOpenAIProviderFromEnv } from './xspresso_openai_responses_provider_v1.js';

/** Checks startup prerequisites without printing secrets or contacting the AI provider. */
export async function runPreflight({ env = process.env, nodeVersion = process.versions.node } = {}) {
  const checks = [];
  const warnings = [];
  const major = Number(String(nodeVersion).split('.')[0]);
  checks.push(check('node_version', Number.isInteger(major) && major >= 20, 'Node.js 20 or newer is required.'));

  let config;
  try {
    config = loadConfig(env);
    checks.push(check('runtime_config', true, 'Runtime configuration is valid.'));
  } catch (error) {
    checks.push(check('runtime_config', false, error.message));
    return { ok: false, checks, warnings };
  }

  let provider = null;
  try {
    provider = createOpenAIProviderFromEnv(env);
    checks.push(check('ai_provider_config', true, provider ? 'AI provider credentials and model are configured.' : 'AI provider is not configured.'));
    if (!provider) warnings.push('Campaign generation will return a configuration error until OPENAI_API_KEY and OPENAI_MODEL are set.');
  } catch (error) {
    checks.push(check('ai_provider_config', false, error.message));
  }

  if (provider) {
    const configuredCost = env.XSPRESSO_GENERATION_CREDIT_COST;
    if (config.nodeEnv === 'production' && (configuredCost === undefined || configuredCost === '')) {
      checks.push(check('generation_credit_cost', false, 'Set XSPRESSO_GENERATION_CREDIT_COST explicitly in production.'));
    } else if (configuredCost !== undefined && configuredCost !== '') {
      const cost = Number(configuredCost);
      checks.push(check('generation_credit_cost', Number.isSafeInteger(cost) && cost >= 0 && cost <= 1_000_000, 'Generation credit cost must be an integer from 0 to 1000000.'));
    } else {
      warnings.push('Generation is configured with zero credits in non-production mode unless a credit cost is set.');
    }
  }

  if (config.nodeEnv === 'production' && config.signupEnabled) {
    warnings.push('Public signup is enabled in production; disable it after initial account setup if open registration is not intended.');
  }

  let probePath;
  let handle;
  try {
    await mkdir(config.dataDir, { recursive: true, mode: 0o700 });
    probePath = join(config.dataDir, `.xspresso-write-test-${process.pid}-${randomUUID()}`);
    handle = await open(probePath, 'wx', 0o600);
    await handle.writeFile('ok');
    await handle.close();
    handle = null;
    await unlink(probePath);
    checks.push(check('data_directory', true, 'Data directory is writable.'));
  } catch {
    await handle?.close().catch(() => {});
    if (probePath) await unlink(probePath).catch(() => {});
    checks.push(check('data_directory', false, 'Data directory is not writable; check XSPRESSO_DATA_DIR permissions.'));
  }

  return { ok: checks.every(item => item.ok), checks, warnings };
}

function check(name, ok, message) { return { name, ok, message }; }

async function main() {
  const report = await runPreflight();
  for (const item of report.checks) console.log(`${item.ok ? 'OK' : 'FAIL'} ${item.name}: ${item.message}`);
  for (const warning of report.warnings) console.warn(`WARN ${warning}`);
  if (!report.ok) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error('Preflight failed:', error.message); process.exitCode = 1; });
}
