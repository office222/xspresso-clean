import { createHash, randomBytes, randomUUID } from 'node:crypto';

/** Server-side Meta OAuth flow with one-time state and encrypted token storage. */
export class MetaOAuthService {
  constructor({ store, vault, appId, appSecret, redirectUri, graphApiVersion, fetchImpl = globalThis.fetch, clock = () => Date.now(), stateTtlMs = 10 * 60_000 } = {}) {
    if (!store || !vault) throw new TypeError('store and encrypted token vault are required.');
    if (!appId || !appSecret || !redirectUri) throw new TypeError('Meta app ID, secret, and redirect URI are required.');
    if (!/^v\d+\.\d+$/.test(String(graphApiVersion || ''))) throw new TypeError('A supported Meta Graph API version is required.');
    const redirect = new URL(redirectUri);
    if (redirect.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(redirect.hostname)) throw new TypeError('Meta redirect URI must use HTTPS outside localhost.');
    this.store = store; this.vault = vault; this.appId = String(appId); this.appSecret = String(appSecret);
    this.redirectUri = redirect.toString(); this.graphApiVersion = graphApiVersion; this.fetchImpl = fetchImpl; this.clock = clock; this.stateTtlMs = stateTtlMs;
  }
  async begin({ user, adAccountId, currency } = {}) {
    if (!user?.id || !user?.tenantId) throw fault('UNAUTHORIZED', 401, 'Sign in to continue.');
    const account = String(adAccountId || '').replace(/^act_/, '');
    const curr = String(currency || '').toUpperCase();
    if (!/^\d{4,40}$/.test(account)) throw fault('INVALID_AD_ACCOUNT', 400, 'Enter a valid Meta ad account ID.');
    if (!/^[A-Z]{3}$/.test(curr)) throw fault('INVALID_CURRENCY', 400, 'Enter the ad account currency as a three-letter code.');
    const state = randomBytes(32).toString('base64url');
    const now = this.clock();
    await this.store.update(db => {
      db.oauthStates ||= [];
      db.oauthStates = db.oauthStates.filter(row => row.expiresAt > now && !row.usedAt);
      db.oauthStates.push({ id: randomUUID(), provider: 'meta', stateHash: sha256(state), tenantId: user.tenantId, userId: user.id, adAccountId: account, currency: curr, createdAt: now, expiresAt: now + this.stateTtlMs, usedAt: null });
    });
    const url = new URL(`https://www.facebook.com/${this.graphApiVersion}/dialog/oauth`);
    url.searchParams.set('client_id', this.appId); url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('response_type', 'code'); url.searchParams.set('state', state); url.searchParams.set('scope', 'ads_read');
    return { authorizationUrl: url.toString(), expiresInSeconds: Math.floor(this.stateTtlMs / 1000) };
  }
  async complete({ state, code, providerError } = {}) {
    const suppliedState = String(state || '');
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(suppliedState)) throw fault('META_OAUTH_STATE_INVALID', 400, 'The Meta connection request expired or is invalid.');
    const now = this.clock();
    const context = await this.store.update(db => {
      db.oauthStates ||= [];
      const row = db.oauthStates.find(x => x.provider === 'meta' && x.stateHash === sha256(suppliedState) && !x.usedAt && x.expiresAt > now);
      if (!row) throw fault('META_OAUTH_STATE_INVALID', 400, 'The Meta connection request expired or is invalid.');
      row.usedAt = now;
      return { tenantId: row.tenantId, userId: row.userId, adAccountId: row.adAccountId, currency: row.currency };
    });
    if (providerError) throw fault('META_OAUTH_DENIED', 400, 'Meta authorization was cancelled or denied.');
    if (!code || String(code).length > 4096) throw fault('META_OAUTH_CODE_MISSING', 400, 'Meta did not return an authorization code.');
    const short = await this.#tokenRequest({ code: String(code) });
    if (!short.access_token) throw fault('META_OAUTH_EXCHANGE_FAILED', 502, 'Meta did not return an access token.');
    let token = short.access_token; let expiresIn = Number(short.expires_in) || null;
    try {
      const long = await this.#tokenRequest({ grant_type: 'fb_exchange_token', fb_exchange_token: token });
      if (long.access_token) token = long.access_token;
      if (Number.isFinite(Number(long.expires_in))) expiresIn = Number(long.expires_in);
    } catch { /* Keep the valid short-lived token; runtime can request reconnection after expiry. */ }
    const accountUrl = new URL(`https://graph.facebook.com/${this.graphApiVersion}/act_${context.adAccountId}`);
    accountUrl.searchParams.set('fields', 'id,currency'); accountUrl.searchParams.set('access_token', token);
    const account = await this.#jsonGet(accountUrl);
    const returnedCurrency = String(account.currency || '').toUpperCase();
    if (String(account.id || '').replace(/^act_/, '') !== context.adAccountId || returnedCurrency !== context.currency) {
      throw fault('META_ACCOUNT_MISMATCH', 400, 'The selected ad account or currency did not match the authorized account.');
    }
    const connected = await this.vault.set({ tenantId: context.tenantId, adAccountId: context.adAccountId, accessToken: token, currency: context.currency });
    const expiresAt = expiresIn ? new Date(this.clock() + expiresIn * 1000).toISOString() : null;
    await this.store.update(db => {
      const row = (db.providerCredentials || []).find(x => x.provider === 'meta' && x.tenantId === context.tenantId);
      if (row) row.expiresAt = expiresAt;
      db.auditEvents ||= []; db.auditEvents.push({ id: randomUUID(), tenantId: context.tenantId, actorId: context.userId, type: 'provider.meta.oauth_connected', at: new Date(this.clock()).toISOString() });
    });
    return { tenantId: context.tenantId, adAccountId: connected.adAccountId, currency: connected.currency, expiresAt };
  }
  async #tokenRequest(params) {
    const url = new URL(`https://graph.facebook.com/${this.graphApiVersion}/oauth/access_token`);
    for (const [key, value] of Object.entries({ client_id: this.appId, client_secret: this.appSecret, redirect_uri: this.redirectUri, ...params })) url.searchParams.set(key, value);
    return this.#jsonGet(url);
  }
  async #jsonGet(url) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await this.fetchImpl(url.toString(), { method: 'GET', redirect: 'error', signal: controller.signal, headers: { accept: 'application/json' } });
      const text = await response.text();
      if (Buffer.byteLength(text) > 1_000_000) throw fault('META_RESPONSE_TOO_LARGE', 502, 'Meta response exceeded the size limit.');
      let body; try { body = JSON.parse(text); } catch { throw fault('META_BAD_RESPONSE', 502, 'Meta returned an invalid response.'); }
      if (!response.ok || body.error) throw fault('META_OAUTH_EXCHANGE_FAILED', 502, 'Meta authorization failed. Check app configuration and account access.');
      return body;
    } catch (error) {
      if (error?.code) throw error;
      if (error?.name === 'AbortError') throw fault('META_TIMEOUT', 504, 'Meta authorization timed out.');
      throw fault('META_NETWORK_ERROR', 502, 'Could not reach Meta authorization.');
    } finally { clearTimeout(timer); }
  }
}
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function fault(code, status, message) { return Object.assign(new Error(message), { code, status }); }
