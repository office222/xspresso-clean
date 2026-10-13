export class XspressoDashboardApiV3 {
  constructor({ baseUrl = "/api", getToken = () => null, fetchImpl = globalThis.fetch } = {}) { this.baseUrl = baseUrl.replace(/\/$/, ""); this.getToken = getToken; this.fetchImpl = fetchImpl; }
  async request(path, { method = "GET", body, raw = false, headers = {}, idempotencyKey } = {}) {
    const h = { Accept: "application/json", ...headers }; const token = this.getToken(); if (token) h.Authorization = `Bearer ${token}`; if (idempotencyKey) h["Idempotency-Key"] = idempotencyKey;
    let payload = body; if (!raw && body !== undefined) { h["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
    const r = await this.fetchImpl(`${this.baseUrl}${path}`, { method, headers: h, body: payload }); const text = await r.text(); let data = {};
    if (text) { try { data = JSON.parse(text); } catch { data = { message: text }; } }
    if (!r.ok) { const e = new Error(data.error || data.message || `Request failed (${r.status})`); e.status = r.status; e.code = data.code; throw e; } return data;
  }
  signup(b) { return this.request("/auth/signup", { method: "POST", body: b }); } login(b) { return this.request("/auth/login", { method: "POST", body: b }); }
  logout() { return this.request("/auth/logout", { method: "POST" }); } me() { return this.request("/auth/me"); }
  campaigns() { return this.request("/campaigns"); } createCampaign(b) { return this.request("/campaigns", { method: "POST", body: b }); }
  campaign(id) { return this.request(`/campaigns/${encodeURIComponent(id)}`); } draft(id) { return this.request(`/campaigns/${encodeURIComponent(id)}/draft`); }
  generate(id, notes, key) { return this.request(`/campaigns/${encodeURIComponent(id)}/generate`, { method: "POST", body: { notes }, idempotencyKey: key }); }
  saveDraft(id, version, draft) { return this.request(`/campaigns/${encodeURIComponent(id)}/draft`, { method: "PUT", body: { expectedVersion: version, draft } }); }
  approveDraft(id, version) { return this.request(`/campaigns/${encodeURIComponent(id)}/approve`, { method: "POST", body: { expectedVersion: version } }); }
  linkExternal(id, body) { return this.request(`/campaigns/${encodeURIComponent(id)}/link-external`, { method: "POST", body }); }
  importMetrics(id, csv, key) { return this.request(`/campaigns/${encodeURIComponent(id)}/metrics/import`, { method: "POST", raw: true, body: csv, idempotencyKey: key, headers: { "Content-Type": "text/csv" } }); }
  metrics(id) { return this.request(`/campaigns/${encodeURIComponent(id)}/metrics`); } monitor(id) { return this.request(`/campaigns/${encodeURIComponent(id)}/monitor`, { method: "POST", body: { thresholds: {} } }); }
  leads() { return this.request("/leads"); } createLead(b) { return this.request("/leads", { method: "POST", body: b }); }
  alerts() { return this.request("/alerts"); } resolveAlert(id) { return this.request(`/alerts/${encodeURIComponent(id)}/resolve`, { method: "POST", body: {} }); }
  credits() { return this.request("/credits"); } settings() { return this.request("/settings"); } updateSettings(b) { return this.request("/settings", { method: "PATCH", body: b }); }
}
