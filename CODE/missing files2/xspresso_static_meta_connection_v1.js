import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const ASSETS = new Map([
  ["/", ["xspresso_dashboard_meta_connection_v1.html", "text/html; charset=utf-8"]],
  ["/xspresso_dashboard_meta_connection_v1.html", ["xspresso_dashboard_meta_connection_v1.html", "text/html; charset=utf-8"]],
  ["/xspresso_dashboard_v2.css", ["xspresso_dashboard_v2.css", "text/css; charset=utf-8"]],
  ["/xspresso_dashboard_app_v3_1.js", ["xspresso_dashboard_app_v3_1.js", "text/javascript; charset=utf-8"]],
  ["/xspresso_dashboard_api_client_v3.js", ["xspresso_dashboard_api_client_v3.js", "text/javascript; charset=utf-8"]],
  ["/xspresso_meta_connection_panel_v1.js", ["xspresso_meta_connection_panel_v1.js", "text/javascript; charset=utf-8"]],
  ["/xspresso_meta_connection_panel_v1.css", ["xspresso_meta_connection_panel_v1.css", "text/css; charset=utf-8"]]
]);
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
function send(res, status, type, body) { res.writeHead(status, { "content-type": type, "content-length": Buffer.byteLength(body), "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin", "content-security-policy": CSP }); res.end(body); }
export function createXspressoStaticMetaConnectionHandler({ api, webRoot = ROOT } = {}) {
  if (typeof api !== "function") throw new TypeError("api handler is required");
  const root = resolve(webRoot);
  return async function staticAndApi(req, res) {
    let pathname;
    try { pathname = new URL(req.url || "/", "http://localhost").pathname; } catch { return send(res, 400, "application/json; charset=utf-8", JSON.stringify({ error: "INVALID_URL" })); }
    if ((req.method === "GET" || req.method === "HEAD") && ASSETS.has(pathname)) {
      const [filename, type] = ASSETS.get(pathname); const path = resolve(root, filename);
      if (!path.startsWith(root + sep)) return send(res, 403, "text/plain; charset=utf-8", "Forbidden");
      try { const data = await readFile(path); res.writeHead(200, { "content-type": type, "content-length": data.length, "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin", "content-security-policy": CSP }); return res.end(req.method === "HEAD" ? undefined : data); }
      catch { return send(res, 500, "text/plain; charset=utf-8", "Dashboard asset unavailable."); }
    }
    return api(req, res);
  };
}