import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadConfig } from './xspresso_config_v1.js';
import { JsonStore } from './xspresso_json_store_v1.js';
import { CreditLedgerService } from './xspresso_credit_ledger_service_v1.js';

/** Local operator utility. It is deliberately not an HTTP endpoint. */
export async function runCreditAdminCommand(args = process.argv.slice(2), { env = process.env, logger = console } = {}) {
  const [command, tenantId, amount, ...reasonParts] = args;
  if (!['grant', 'balance'].includes(command) || !tenantId) {
    throw new Error('Usage: node xspresso_credit_admin_cli_v1.js grant <tenantId> <credits> [reason] | balance <tenantId>');
  }
  const config = loadConfig(env);
  const store = new JsonStore({ filePath: config.dataFile });
  await store.init();
  const ledger = new CreditLedgerService({ store });
  if (command === 'balance') {
    const result = await ledger.getBalance(tenantId);
    logger.log(JSON.stringify({ tenantId, balance: result.balance }, null, 2));
    await store.flush();
    return result;
  }
  const credits = Number(amount);
  if (!Number.isSafeInteger(credits) || credits < 1) throw new Error('credits must be a positive integer.');
  const reason = reasonParts.join(' ').trim() || 'Operator credit grant';
  const result = await ledger.post({
    tenantId, actorId: env.XSPRESSO_ADMIN_ACTOR || 'local-operator', actorRole: 'admin',
    kind: 'grant', credits, reason, idempotencyKey: `manual-grant:${randomUUID()}`
  });
  logger.log(JSON.stringify({ tenantId, granted: credits, balance: result.balance }, null, 2));
  await store.flush();
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCreditAdminCommand().catch(error => { console.error(error.message); process.exitCode = 1; });
}
