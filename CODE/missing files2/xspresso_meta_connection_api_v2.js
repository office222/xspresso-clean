export const XSPRESSO_SESSION_KEY = 'xspresso_token';

export function readXspressoSessionToken(storage = globalThis.sessionStorage) {
  try { return storage?.getItem(XSPRESSO_SESSION_KEY) || ''; }
  catch { return ''; }
}

export class MetaConnectionApi {
  constructor({ fetchImpl = globalThis.fetch, getToken = readXspressoSessionToken, baseUrl = '/api/integrations/meta' } = {}) {
    if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl is required');
    this.fetchImpl = fetchImpl;
    this.getToken = getToken;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  async #request(path, options = {}) {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
      options = { ...options, body: JSON.stringify(options.body) };
    }
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, { ...options, headers });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw }; }
    if (!response.ok) {
      const error = new Error(data.error || data.message || `Request failed (${response.status}).`);
      error.status = response.status;
      error.code = data.code || 'REQUEST_FAILED';
      throw error;
    }
    return data;
  }
  status() { return this.#request('/status'); }
  connect({ adAccountId, currency }) {
    return this.#request('/connect', { method: 'POST', body: { adAccountId, currency } });
  }
  disconnect() { return this.#request('/connection', { method: 'DELETE' }); }
}
