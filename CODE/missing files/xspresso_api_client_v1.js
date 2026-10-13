/** Browser-side fetch client for xspresso_api_routes.js. Keeps bearer token in memory only. */
export class XspressoApiError extends Error {
  constructor(message, { status, code, payload } = {}) {
    super(message || 'Xspresso request failed.');
    this.name = 'XspressoApiError'; this.status = status ?? 0; this.code = code || 'REQUEST_FAILED'; this.payload = payload ?? null;
  }
}

export class XspressoApiClient {
  constructor({ baseUrl = '', fetchImpl = globalThis.fetch, token = null } = {}) {
    if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required.');
    this.baseUrl = String(baseUrl).replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
    this.token = token;
  }

  setToken(token) { this.token = typeof token === 'string' && token ? token : null; }
  clearToken() { this.token = null; }

  async request(path, { method = 'GET', body, headers = {}, auth = true, signal } = {}) {
    if (typeof path !== 'string' || !path.startsWith('/api/')) throw new TypeError('API paths must begin with /api/.');
    const requestHeaders = new Headers(headers);
    if (body !== undefined && !requestHeaders.has('content-type')) requestHeaders.set('content-type', 'application/json');
    if (auth && this.token) requestHeaders.set('authorization', `Bearer ${this.token}`);
    let response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body), signal,
        credentials: 'omit', cache: 'no-store'
      });
    } catch (cause) {
      throw new XspressoApiError('Could not reach the Xspresso server.', { code: 'NETWORK_ERROR', payload: { cause: cause?.message } });
    }
    const raw = response.status === 204 ? '' : await response.text();
    let payload = null;
    if (raw) {
      try { payload = JSON.parse(raw); }
      catch { throw new XspressoApiError('The server returned an invalid response.', { status: response.status, code: 'INVALID_SERVER_RESPONSE' }); }
    }
    if (!response.ok) throw new XspressoApiError(payload?.message || `Request failed (${response.status}).`, {
      status: response.status, code: payload?.error || 'REQUEST_FAILED', payload
    });
    return payload;
  }

  async signup({ email, password, name }) {
    const result = await this.request('/api/auth/signup', { method: 'POST', body: { email, password, name }, auth: false });
    this.setToken(result?.token); return result;
  }
  async login({ email, password }) {
    const result = await this.request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });
    this.setToken(result?.token); return result;
  }
  async logout() {
    try { return await this.request('/api/auth/logout', { method: 'POST', body: {} }); }
    finally { this.clearToken(); }
  }
  me() { return this.request('/api/auth/me'); }
  listCampaigns() { return this.request('/api/campaigns'); }
  getCampaign(id) { return this.request(`/api/campaigns/${encodeURIComponent(id)}`); }
  createCampaign(data) { return this.request('/api/campaigns', { method: 'POST', body: data }); }
  updateCampaign(id, patch) { return this.request(`/api/campaigns/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch }); }
  archiveCampaign(id) { return this.request(`/api/campaigns/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
}
