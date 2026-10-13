import { XspressoDashboardApiV3 } from "./xspresso_dashboard_api_client_v3.js";

const SESSION_KEY = "xspresso.session.v2";

/** Thin client for the server-side Meta OAuth endpoints. The access token is never handled in the browser. */
export function createMetaConnectionApi({ getToken = () => sessionStorage.getItem(SESSION_KEY), fetchImpl = globalThis.fetch, baseUrl = "/api/integrations/meta" } = {}) {
  const base = baseUrl.replace(/\/$/, "");
  return {
    status: () => request(`${base}/status`),
    connect: (payload) => request(`${base}/connect`, { method: "POST", body: payload }),
    disconnect: () => request(`${base}/connection`, { method: "DELETE" })
  };
  async function request(url, { method = "GET", body } = {}) {
    const headers = { Accept: "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetchImpl(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await response.text();
    let data = {};
    if (text) { try { data = JSON.parse(text); } catch { data = { message: text }; } }
    if (!response.ok) { const error = new Error(data.message || data.error || `Request failed (${response.status})`); error.status = response.status; error.code = data.error; throw error; }
    return data;
  }
}

/** Adds an account-connect card to the existing Xspresso dashboard without changing its core renderer. */
export function mountMetaConnectionPanel({ documentImpl = globalThis.document, windowImpl = globalThis.window, api = createMetaConnectionApi() } = {}) {
  if (!documentImpl || !windowImpl) return () => {};
  let observer;
  const ensure = () => {
    const app = documentImpl.querySelector("#app");
    const target = app?.querySelector("main") || app;
    if (!target || documentImpl.getElementById("xspresso-meta-connection-panel")) return;
    const panel = documentImpl.createElement("section");
    panel.id = "xspresso-meta-connection-panel";
    panel.className = "xspresso-meta-panel";
    panel.setAttribute("aria-labelledby", "xspresso-meta-title");
    const title = documentImpl.createElement("h2"); title.id = "xspresso-meta-title"; title.textContent = "Meta Ads connection";
    const copy = documentImpl.createElement("p"); copy.className = "xspresso-meta-copy"; copy.textContent = "Connect read-only insights. Xspresso will not create, edit, pause, or publish ads.";
    const status = documentImpl.createElement("p"); status.className = "xspresso-meta-status"; status.setAttribute("role", "status"); status.textContent = "Checking connection…";
    const accountLabel = documentImpl.createElement("label"); accountLabel.textContent = "Meta ad account ID";
    const accountInput = documentImpl.createElement("input"); accountInput.inputMode = "numeric"; accountInput.autocomplete = "off"; accountInput.placeholder = "Digits only"; accountLabel.append(accountInput);
    const currencyLabel = documentImpl.createElement("label"); currencyLabel.textContent = "Account currency";
    const currencyInput = documentImpl.createElement("input"); currencyInput.value = "USD"; currencyInput.maxLength = 3; currencyInput.autocomplete = "off"; currencyInput.placeholder = "USD"; currencyLabel.append(currencyInput);
    const controls = documentImpl.createElement("div"); controls.className = "xspresso-meta-controls";
    const connect = documentImpl.createElement("button"); connect.type = "button"; connect.textContent = "Connect Meta";
    const disconnect = documentImpl.createElement("button"); disconnect.type = "button"; disconnect.textContent = "Disconnect"; disconnect.className = "xspresso-meta-secondary"; disconnect.hidden = true;
    const refresh = documentImpl.createElement("button"); refresh.type = "button"; refresh.textContent = "Refresh status"; refresh.className = "xspresso-meta-secondary";
    controls.append(connect, disconnect, refresh);
    panel.append(title, copy, status, accountLabel, currencyLabel, controls);
    target.prepend(panel);

    const setBusy = (busy) => { connect.disabled = busy; disconnect.disabled = busy; refresh.disabled = busy; };
    const updateStatus = async () => {
      if (!api) return;
      if (!sessionStorage.getItem(SESSION_KEY)) { status.textContent = "Sign in to connect a Meta account."; return; }
      setBusy(true);
      try {
        const result = await api.status();
        if (result.connected && result.connections?.length) {
          const item = result.connections[0];
          status.textContent = `Connected: ad account ${item.adAccountId} (${item.currency}).`;
          accountInput.value = item.adAccountId; currencyInput.value = item.currency || "USD";
          disconnect.hidden = false;
        } else { status.textContent = "No Meta account connected."; disconnect.hidden = true; }
      } catch (error) { status.textContent = error.status === 401 ? "Sign in to connect a Meta account." : (error.message || "Could not check Meta connection."); }
      finally { setBusy(false); }
    };
    connect.addEventListener("click", async () => {
      const adAccountId = accountInput.value.trim(); const currency = currencyInput.value.trim().toUpperCase();
      if (!/^\d{4,40}$/.test(adAccountId) || !/^[A-Z]{3}$/.test(currency)) { status.textContent = "Enter a numeric ad account ID and a three-letter currency code."; return; }
      setBusy(true);
      try { const result = await api.connect({ adAccountId, currency }); if (!result.authorizationUrl) throw new Error("The server did not return an authorization URL."); windowImpl.location.assign(result.authorizationUrl); }
      catch (error) { status.textContent = error.message || "Could not start Meta authorization."; setBusy(false); }
    });
    disconnect.addEventListener("click", async () => { setBusy(true); try { await api.disconnect(); status.textContent = "Meta disconnected."; disconnect.hidden = true; } catch (error) { status.textContent = error.message || "Could not disconnect Meta."; } finally { setBusy(false); } });
    refresh.addEventListener("click", () => void updateStatus());
    void updateStatus();
  };
  observer = new MutationObserver(() => ensure());
  const app = documentImpl.querySelector("#app");
  if (app) observer.observe(app, { childList: true, subtree: true });
  ensure();
  const onFocus = () => ensure();
  const onSubmit = () => windowImpl.setTimeout(ensure, 300);
  windowImpl.addEventListener("focus", onFocus);
  documentImpl.addEventListener("submit", onSubmit, true);
  return () => { observer?.disconnect(); windowImpl.removeEventListener("focus", onFocus); documentImpl.removeEventListener("submit", onSubmit, true); };
}

if (typeof document !== "undefined") mountMetaConnectionPanel();