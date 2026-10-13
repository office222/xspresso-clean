import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const ASSETS = new Map([
 ["/", ["xspresso_dashboard_metrics_v3.html", "text/html; charset=utf-8"]],
 ["/xspresso_dashboard_metrics_v3.html", ["xspresso_dashboard_metrics_v3.html", "text/html; charset=utf-8"]],
 ["/xspresso_dashboard_v2.css", ["xspresso_dashboard_v2.css", "text/css; charset=utf-8"]],
 ["/xspresso_dashboard_app_v3.js", ["xspresso_dashboard_app_v3.js", "text/javascript; charset=utf-8"]],
 ["/xspresso_dashboard_api_client_v3.js", ["xspresso_dashboard_api_client_v3.js", "text/javascript; charset=utf-8"]],
]);
function send(res, status, type, body) { res.writeHead(status, { "Content-Type": type, "Content-Length": Buffer.byteLength(body), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" }); res.end(body); }
export function createXspressoStaticHandlerV3({ api, webRoot = ROOT } = {}) {
 if (typeof api !== "function") throw new TypeError("api handler is required"); const root = resolve(webRoot);
 return async function handler(req, res) {
  let pathname; try { pathname = new URL(req.url || "/", "http://localhost").pathname; } catch { return send(res, 400, "application/json; charset=utf-8", JSON.stringify({ error: "Invalid request URL" })); }
  if ((req.method === "GET" || req.method === "HEAD") && ASSETS.has(pathname)) {
   const [filename, type] = ASSETS.get(pathname), path = resolve(root, filename); if (!path.startsWith(root + sep)) return send(res, 403, "text/plain; charset=utf-8", "Forbidden");
   try { const data = await readFile(path); res.writeHead(200, { "Content-Type": type, "Content-Length": data.length, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" }); return res.end(req.method === "HEAD" ? undefined : data); }
   catch { return send(res, 500, "text/plain; charset=utf-8", "Dashboard assets unavailable."); }
  }
  return api(req, res);
 };
}
