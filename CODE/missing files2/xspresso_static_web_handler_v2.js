import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const assets = new Map([
  ["/", ["xspresso_dashboard_v2.html", "text/html; charset=utf-8"]],
  ["/xspresso_dashboard_v2.html", ["xspresso_dashboard_v2.html", "text/html; charset=utf-8"]],
  ["/xspresso_dashboard_v2.css", ["xspresso_dashboard_v2.css", "text/css; charset=utf-8"]],
  ["/xspresso_dashboard_app_v2.js", ["xspresso_dashboard_app_v2.js", "text/javascript; charset=utf-8"]],
  ["/xspresso_dashboard_api_v2.js", ["xspresso_dashboard_api_v2.js", "text/javascript; charset=utf-8"]],
]);
function send(res, status, type, body, headers = {}) { res.writeHead(status, { "Content-Type": type, "Content-Length": Buffer.byteLength(body), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'", ...headers }); res.end(body); }
export function createXspressoStaticHandlerV2({ api, webRoot = DEFAULT_ROOT } = {}) {
  if (typeof api !== "function") throw new TypeError("api handler is required");
  const root = resolve(webRoot);
  return async function staticAndApi(req, res) {
    let pathname;
    try { pathname = new URL(req.url || "/", "http://localhost").pathname; }
    catch { return send(res, 400, "application/json; charset=utf-8", JSON.stringify({ error: "Invalid request URL" })); }
    if ((req.method === "GET" || req.method === "HEAD") && assets.has(pathname)) {
      const [file, type] = assets.get(pathname);
      const path = resolve(root, file);
      if (!path.startsWith(root + sep)) return send(res, 403, "text/plain; charset=utf-8", "Forbidden");
      try {
        const body = await readFile(path);
        res.writeHead(200, { "Content-Type": type, "Content-Length": body.length, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" });
        return res.end(req.method === "HEAD" ? undefined : body);
      } catch { return send(res, 500, "text/plain; charset=utf-8", "Dashboard assets are unavailable."); }
    }
    return api(req, res);
  };
}
