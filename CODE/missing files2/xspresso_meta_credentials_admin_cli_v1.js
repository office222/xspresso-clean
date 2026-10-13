import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadConfig } from './xspresso_config_v1.js';
import { JsonStore } from './xspresso_json_store_v1.js';
import { MetaTenantTokenVault } from './xspresso_meta_tenant_token_v1.js';

/** Local operator tool. Never pass the token as a command-line argument. */
export async function runMetaCredentialCommand({ argv = process.argv.slice(2), env = process.env } = {}) {
  const [command, tenantId] = argv;
  if (!['set', 'remove', 'list'].includes(command)) throw new Error('Usage: node xspresso_meta_credentials_admin_cli_v1.js <set|remove|list> [tenantId]');
  const config = loadConfig(env); const store = new JsonStore({ filePath: config.dataFile }); await store.init();
  const vault = new MetaTenantTokenVault({ store, encryptionKey: env.XSPRESSO_CREDENTIALS_ENCRYPTION_KEY });
  if (command === 'set') {
    if (!tenantId) throw new Error('set requires a tenantId.');
    const result = await vault.set({ tenantId, adAccountId: env.XSPRESSO_META_AD_ACCOUNT_ID, currency: env.XSPRESSO_META_CURRENCY, accessToken: env.XSPRESSO_META_ACCESS_TOKEN });
    return `Saved encrypted Meta credentials for tenant ${result.tenantId}, account ${result.adAccountId} (${result.currency}).`;
  }
  if (command === 'remove') {
    if (!tenantId) throw new Error('remove requires a tenantId.');
    const result = await vault.remove(tenantId); return result.removed ? `Removed Meta credentials for tenant ${tenantId}.` : `No Meta credentials existed for tenant ${tenantId}.`;
  }
  const rows = await vault.list(); return rows.length ? rows.map(x => `${x.tenantId}\t${x.adAccountId}\t${x.currency}\t${x.updatedAt}`).join('\n') : 'No Meta credentials are configured.';
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) runMetaCredentialCommand().then(console.log).catch(error => { console.error(error.message); process.exitCode = 1; });
