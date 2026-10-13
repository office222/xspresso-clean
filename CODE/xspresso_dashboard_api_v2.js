export class XspressoDashboardApi {
  constructor({ baseUrl = "/api", getToken = () => null, fetchImpl = globalThis.fetch } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.getToken = getToken;
    this.fetchImpl = fetchImpl;
  }
  async request(path, { method = "GET", body, headers = {}, raw = false, idempotencyKey } = {}) {
    const token = this.getToken();
    const requestHeaders = { Accept: "application/json", ...headers };
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
    if (idempotencyKey) requestHeaders["Idempotency-Key"] = idempotencyKey;
    let payload = body;
    if (!raw && body !== undefined) {
      requestHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, { method, headers: requestHeaders, body: payload });
    const text = await response.text();
    let data = {};
    if (text) { try { data = JSON.parse(text); } catch { data = { message: text }; } }
    if (!response.ok) {
      const error = new Error(data.error || data.message || `Request failed (${response.status})`);
      error.status = response.status; error.code = data.code; throw error;
    }
    return data;
  }
  signup(body) { return this.request("/auth/signup", { method: "POST", body }); }
  login(body) { return this.request("/auth/login", { method: "POST", body }); }
  logout() { return this.request("/auth/logout", { method: "POST" }); }
  me() { return this.request("/auth/me"); }
  campaigns() { return this.request("/campaigns"); }
  createCampaign(body) { return this.request("/campaigns", { method: "POST", body }); }
  campaign(id) { return this.request(`/campaigns/${encodeURIComponent(id)}`); }
  draft(id) { return this.request(`/campaigns/${encodeURIComponent(id)}/draft`); }
  generate(id, notes, idempotencyKey) { return this.request(`/campaigns/${encodeURIComponent(id)}/generate`, { method: "POST", body: { notes }, idempotencyKey }); }
  saveDraft(id, expectedVersion, draft) { return this.request(`/campaigns/${encodeURIComponent(id)}/draft`, { method: "PUT", body: { expectedVersion, draft } }); }
  approveDraft(id, expectedVersion) { return this.request(`/campaigns/${encodeURIComponent(id)}/approve`, { method: "POST", body: { expectedVersion } }); }
  linkExternal(id, body) { return this.request(`/campaigns/${encodeURIComponent(id)}/link-external`, { method: "POST", body }); }
  importMetrics(id, csv, idempotencyKey) { return this.request(`/campaigns/${encodeURIComponent(id)}/metrics/import`, { method: "POST", body: csv, raw: true, idempotencyKey, headers: { "Content-Type": "text/csv" } }); }
  metrics(id) { return this.request(`/campaigns/${encodeURIComponent(id)}/metrics`); }
  monitor(id, thresholds = {}) { return this.request(`/campaigns/${encodeURIComponent(id)}/monitor`, { method: "POST", body: { thresholds } }); }
  leads() { return this.request("/leads"); }
  createLead(body) { return this.request("/leads", { method: "POST", body }); }
  alerts() { return this.request("/alerts"); }
  resolveAlert(id) { return this.request(`/alerts/${encodeURIComponent(id)}/resolve`, { method: "POST", body: {} }); }
  credits() { return this.request("/credits"); }
  settings() { return this.request("/settings"); }
  updateSettings(body) { return this.request("/settings", { method: "PATCH", body }); }
}
