import { XspressoDashboardApi } from "./xspresso_dashboard_api_v2.js";

const app = document.querySelector("#app");
const tokenKey = "xspresso.session.v2";
const state = { token: sessionStorage.getItem(tokenKey), user: null, view: "overview", campaigns: [], leads: [], alerts: [], credits: null, selected: null, draft: null, draftVersion: 0, metrics: null, notice: null, busy: false, authMode: "login" };
const api = new XspressoDashboardApi({ getToken: () => state.token });
const node = (tag, attrs = {}, children = []) => {
  const item = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "className") item.className = value;
    else if (key.startsWith("on") && typeof value === "function") item.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== undefined && value !== null) item.setAttribute(key, String(value));
  }
  for (const child of Array.isArray(children) ? children : [children]) if (child != null) item.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return item;
};
const button = (label, action, style = "") => node("button", { className: `button ${style}`, type: "button", disabled: state.busy, onclick: action }, label);
const field = (label, name, type = "text", value = "", required = true) => {
  const wrap = node("div", { className: "field" });
  const input = type === "textarea" ? node("textarea", { name, required }) : node("input", { name, type, value, required });
  wrap.append(node("label", {}, label), input); return wrap;
};
const explain = (text) => node("p", { className: "hint" }, text);
function showNotice(text, kind = "") { state.notice = { text, kind }; }
async function run(task) {
  state.busy = true; render();
  try { await task(); }
  catch (error) { if (error.status === 401) { clearSession(); } else showNotice(error.message || "Request failed.", "error"); }
  finally { state.busy = false; render(); }
}
function clearSession() { state.token = null; state.user = null; sessionStorage.removeItem(tokenKey); }
async function refresh() {
  const [campaigns, leads, alerts, credits] = await Promise.allSettled([api.campaigns(), api.leads(), api.alerts(), api.credits()]);
  state.campaigns = campaigns.status === "fulfilled" ? campaigns.value.campaigns || [] : [];
  state.leads = leads.status === "fulfilled" ? leads.value.leads || [] : [];
  state.alerts = alerts.status === "fulfilled" ? alerts.value.alerts || [] : [];
  state.credits = credits.status === "fulfilled" ? credits.value.balance : null;
}
function authView() {
  const form = node("form", { className: "auth-card" });
  form.append(node("h1", {}, "Xspresso"), explain("AI-assisted marketing, with you in control."));
  if (state.notice) form.append(node("div", { className: `notice ${state.notice.kind}` }, state.notice.text));
  if (state.authMode === "signup") form.append(field("Name", "name"));
  form.append(field("Email", "email", "email"), field("Password", "password"));
  form.append(node("button", { className: "button", disabled: state.busy }, state.authMode === "login" ? "Sign in" : "Create account"));
  form.addEventListener("submit", (event) => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(form));
    void run(async () => {
      const result = state.authMode === "login" ? await api.login(data) : await api.signup(data);
      state.token = result.token; sessionStorage.setItem(tokenKey, result.token);
      state.user = result.user; state.notice = null; await refresh(); state.view = "overview";
    });
  });
  form.append(node("p", { className: "muted" }, state.authMode === "login" ? "New to Xspresso? " : "Already registered? "),
    button(state.authMode === "login" ? "Create an account" : "Sign in", () => { state.authMode = state.authMode === "login" ? "signup" : "login"; state.notice = null; render(); }, "secondary"));
  return node("div", { className: "auth-wrap" }, form);
}
function shell(content) {
  const navItems = [["overview", "Overview"], ["campaigns", "Campaigns"], ["leads", "Leads"], ["alerts", "Alerts"], ["settings", "Settings"]];
  const side = node("aside", { className: "sidebar" }, [node("div", { className: "brand" }, "Xspresso"), node("nav", { className: "nav" }, navItems.map(([id, title]) => node("button", { className: state.view === id ? "active" : "", onclick: () => { state.view = id; state.notice = null; render(); } }, title))), node("p", { className: "sidebar-note" }, "Review AI drafts before approval. Metrics import and monitoring do not publish or change ad spend.")]);
  const header = node("header", { className: "topbar" }, [node("h1", {}, navItems.find(([id]) => id === state.view)?.[1] || "Workspace"), node("div", { className: "userline" }, [node("span", {}, state.user?.email || ""), button("Sign out", () => void run(async () => { await api.logout(); clearSession(); state.notice = null; }), "secondary")])]);
  const main = node("main", {});
  if (state.notice) main.append(node("div", { className: `notice ${state.notice.kind}` }, state.notice.text));
  main.append(content);
  return node("div", { className: "shell" }, [side, node("div", { className: "main" }, [header, main])]);
}
function overview() {
  const stats = node("div", { className: "grid" }, [
    stat("Campaigns", state.campaigns.length), stat("Leads", state.leads.length), stat("Open alerts", state.alerts.filter((a) => a.status !== "resolved").length), stat("Credits", state.credits ?? "—")
  ]);
  const recent = node("section", { className: "panel" }, [node("h2", { className: "section-title" }, "Your campaigns"), campaignList()]);
  return node("div", {}, [stats, node("section", { className: "panel" }, [node("h2", { className: "section-title" }, "Human-controlled automation"), explain("Xspresso can draft and monitor. You decide what to edit and approve. It never publishes ads from this workspace."), button("Create a campaign", () => { state.view = "campaigns"; render(); })]), recent]);
}
function stat(title, value) { return node("section", { className: "card" }, [node("div", { className: "muted" }, title), node("div", { className: "stat" }, value)]); }
function campaignList() {
  if (!state.campaigns.length) return node("div", { className: "empty" }, "No campaigns yet. Create one to start a draft.");
  return node("div", { className: "list" }, state.campaigns.map((campaign) => node("div", { className: "list-item row between" }, [node("div", {}, [node("h3", {}, campaign.name), node("span", { className: "badge" }, campaign.status || "draft"), explain(`${campaign.platform || "No platform"} · ${campaign.goal || "No objective"}`)]), button("Open", () => void openCampaign(campaign.id), "secondary")])));
}
function campaignsView() {
  const form = node("form", { className: "panel stack" }, [node("h2", { className: "section-title" }, "Create campaign"), field("Campaign name", "name"), node("div", { className: "field" }, [node("label", {}, "Platform"), node("select", { name: "platform" }, ["meta", "google", "linkedin", "tiktok", "other"].map((x) => node("option", { value: x }, x)))]), field("Objective", "goal"), field("Product or service", "product"), field("Target audience", "audience"), field("Offer / key details", "offer", "textarea", "", false), field("Verified claims only (one per line)", "verifiedClaims", "textarea", "", false), button("Create draft campaign", () => {}, "" )]);
  form.querySelector("button").type = "submit";
  form.addEventListener("submit", (event) => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(form));
    void run(async () => {
      const created = await api.createCampaign({ name: values.name, platform: values.platform, goal: values.goal, brief: { product: values.product, audience: values.audience, offer: values.offer, verifiedClaims: values.verifiedClaims.split("\n").map((x) => x.trim()).filter(Boolean) } });
      await refresh(); state.selected = created.campaign; state.draft = null; state.draftVersion = 0; showNotice("Campaign created. Generate a draft when ready.", "success");
    });
  });
  const section = node("section", { className: "panel" }, [node("h2", { className: "section-title" }, "Campaign library"), campaignList()]);
  return node("div", {}, [form, section, state.selected ? campaignDetail() : node("div", { className: "empty" }, "Select a campaign to edit, approve, link an existing live campaign, or import metrics.")]);
}
async function openCampaign(id) {
  await run(async () => {
    const result = await api.campaign(id); state.selected = result.campaign;
    const d = await api.draft(id); state.draft = d.draft || null; state.draftVersion = d.version ?? 0;
    state.metrics = null; state.view = "campaigns";
  });
}
function campaignDetail() {
  const campaign = state.selected;
  const section = node("section", { className: "panel stack" }, [node("div", { className: "row between" }, [node("div", {}, [node("h2", { className: "section-title" }, campaign.name), node("span", { className: "badge" }, campaign.status || "draft")]), button("Refresh", () => void openCampaign(campaign.id), "secondary")])]);
  const notes = field("Ideas / tweaks for the AI", "notes", "textarea", "", false);
  const generateForm = node("form", { className: "stack" }, [notes, node("button", { className: "button", disabled: state.busy }, "Generate or revise draft")]);
  generateForm.addEventListener("submit", (event) => { event.preventDefault(); const text = new FormData(generateForm).get("notes"); void run(async () => { await api.generate(campaign.id, text, crypto.randomUUID()); const saved = await api.draft(campaign.id); state.draft = saved.draft; state.draftVersion = saved.version ?? 0; await refresh(); showNotice("Draft generated. Review and edit it before approval.", "success"); }); });
  section.append(node("h3", {}, "AI draft"), explain("The AI creates a draft only. You can edit and save a version before approving it."), generateForm);
  const editor = node("textarea", { className: "large", "aria-label": "Editable campaign draft" }); editor.value = state.draft ? JSON.stringify(state.draft, null, 2) : ""; editor.disabled = !state.draft;
  const save = button("Save edits", () => void run(async () => { const draft = JSON.parse(editor.value); const result = await api.saveDraft(campaign.id, state.draftVersion, draft); state.draft = result.draft; state.draftVersion = result.version; showNotice(`Saved draft version ${result.version}.`, "success"); }), "secondary"); save.disabled = state.busy || !state.draft;
  const approve = button("Approve this version", () => void run(async () => { const result = await api.approveDraft(campaign.id, state.draftVersion); showNotice(`Version ${result.version ?? state.draftVersion} approved. It has not been published.`, "success"); }), ""); approve.disabled = state.busy || !state.draft;
  section.append(node("div", { className: "field" }, [node("label", {}, `Draft JSON · version ${state.draftVersion}`), editor]), node("div", { className: "row" }, [save, approve]));
  section.append(externalLinkPanel(campaign), metricsPanel(campaign));
  return section;
}
function externalLinkPanel(campaign) {
  const form = node("form", { className: "panel stack" }, [node("h3", {}, "Link an already-live campaign"), explain("This records an external campaign you already launched. Xspresso will not create or publish it."), node("div", { className: "field" }, [node("label", {}, "Ad platform"), node("select", { name: "platform" }, ["meta", "google", "linkedin", "tiktok", "other"].map((x) => node("option", { value: x }, x)))]), field("External campaign ID", "externalCampaignId"), node("label", { className: "check" }, [node("input", { type: "checkbox", name: "confirmAlreadyLive", required: true }), node("span", {}, "I confirm this campaign is already live in the external platform.")]), node("button", { className: "button secondary", type: "submit" }, "Link existing campaign")]);
  form.addEventListener("submit", (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(form)); void run(async () => { await api.linkExternal(campaign.id, { platform: values.platform, externalCampaignId: values.externalCampaignId, confirmAlreadyLive: values.confirmAlreadyLive === "on" }); await openCampaign(campaign.id); showNotice("External campaign linked. Import metrics to monitor it.", "success"); }); });
  return form;
}
function metricsPanel(campaign) {
  const form = node("form", { className: "panel stack" }, [node("h3", {}, "Import metrics CSV"), explain("Required columns: date, ad_id, impressions, clicks, spend, conversions, currency."), node("input", { type: "file", accept: ".csv,text/csv", name: "file", required: true }), node("button", { className: "button secondary", type: "submit" }, "Import CSV")]);
  form.addEventListener("submit", (event) => { event.preventDefault(); const file = new FormData(form).get("file"); void run(async () => { const result = await api.importMetrics(campaign.id, await file.text(), crypto.randomUUID()); const m = await api.metrics(campaign.id); state.metrics = m; showNotice(`Metrics imported: ${result.imported ?? 0} rows (${result.updated ?? 0} updated).`, "success"); }); });
  const monitor = button("Run monitoring rules", () => void run(async () => { const result = await api.monitor(campaign.id); await refresh(); showNotice(`Monitoring complete. ${result.alertCount ?? 0} alert(s) updated.`, "success"); }), "secondary");
  const items = state.metrics?.ads || [];
  const table = node("div", { className: "table-wrap" });
  if (items.length) {
    const rows = items.map((ad) => node("tr", {}, [node("td", {}, ad.externalAdId || ad.adId), node("td", {}, ad.currency || ""), node("td", {}, ad.metrics?.impressions ?? ad.impressions ?? 0), node("td", {}, ad.metrics?.clicks ?? ad.clicks ?? 0), node("td", {}, ad.metrics?.spend ?? ad.spend ?? 0), node("td", {}, ad.metrics?.conversions ?? ad.conversions ?? 0)]));
    table.append(node("table", {}, [node("thead", {}, node("tr", {}, ["Ad", "Currency", "Impressions", "Clicks", "Spend", "Conversions"].map((t) => node("th", {}, t)))), node("tbody", {}, rows)]));
  } else table.append(explain("No imported metrics loaded for this campaign."));
  const load = button("Load imported metrics", () => void run(async () => { state.metrics = await api.metrics(campaign.id); }), "secondary");
  return node("section", { className: "panel stack" }, [node("h3", {}, "Performance monitoring"), explain("CSV imports provide data only; monitoring creates alerts and does not change live ads or budgets."), form, node("div", { className: "row" }, [load, monitor]), table]);
}
function leadsView() {
  const form = node("form", { className: "panel stack" }, [node("h2", {}, "Add a consented lead"), field("Name", "name", "text", "", false), field("Email", "email", "email"), node("label", { className: "check" }, [node("input", { type: "checkbox", name: "consent", required: true }), node("span", {}, "I confirm this person explicitly consented to receive follow-up.")]), node("button", { className: "button", type: "submit" }, "Save lead")]);
  form.addEventListener("submit", (event) => { event.preventDefault(); const v = Object.fromEntries(new FormData(form)); void run(async () => { await api.createLead({ name: v.name, email: v.email, consent: v.consent === "on", source: "dashboard" }); const result = await api.leads(); state.leads = result.leads || []; showNotice("Lead saved with consent recorded.", "success"); }); });
  const table = node("div", { className: "panel table-wrap" });
  table.append(node("h2", {}, "Leads"));
  table.append(state.leads.length ? node("table", {}, [node("thead", {}, node("tr", {}, ["Name", "Email", "Status"].map((x) => node("th", {}, x)))), node("tbody", {}, state.leads.map((l) => node("tr", {}, [node("td", {}, l.name || "—"), node("td", {}, l.email), node("td", {}, l.status || (l.optedOutAt ? "unsubscribed" : "new"))])))])) : node("div", { className: "empty" }, "No leads yet."));
  return node("div", {}, [form, table]);
}
function alertsView() {
  if (!state.alerts.length) return node("div", { className: "empty" }, "No monitoring alerts yet.");
  return node("div", { className: "list" }, state.alerts.map((a) => node("article", { className: "panel" }, [node("div", { className: "row between" }, [node("h2", { className: "section-title" }, a.title || a.type), node("span", { className: `badge ${a.status === "open" ? "warn" : "good"}` }, a.status || "open")]), explain(a.message || ""), a.recommendation ? explain(`Recommendation: ${a.recommendation}`) : null, a.status === "resolved" ? null : button("Resolve alert", () => void run(async () => { await api.resolveAlert(a.id); await refresh(); }), "secondary")]));
}
function settingsView() {
  const form = node("form", { className: "panel stack" }, [node("h2", {}, "Workspace settings"), field("Default tone", "defaultTone", "text", "Clear and helpful", false), field("Weekly budget reference (not an ad spend control)", "weeklyBudget", "number", "0", false), node("button", { className: "button" }, "Save settings")]);
  form.addEventListener("submit", (event) => { event.preventDefault(); const v = Object.fromEntries(new FormData(form)); void run(async () => { await api.updateSettings({ defaultTone: v.defaultTone, weeklyBudget: Number(v.weeklyBudget || 0) }); showNotice("Settings saved.", "success"); }); });
  return form;
}
function render() {
  if (!state.token) { app.replaceChildren(authView()); return; }
  let content = state.view === "campaigns" ? campaignsView() : state.view === "leads" ? leadsView() : state.view === "alerts" ? alertsView() : state.view === "settings" ? settingsView() : overview();
  app.replaceChildren(shell(content));
}
async function boot() {
  if (state.token) {
    try { const me = await api.me(); state.user = me.user; await refresh(); }
    catch { clearSession(); }
  }
  render();
}
void boot();
