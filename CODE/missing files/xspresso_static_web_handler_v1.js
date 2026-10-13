import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = dirname(fileURLToPath(import.meta.url));
const ASSETS = new Map([
  ['/','xspresso_dashboard.html'], ['/xspresso_dashboard.html','xspresso_dashboard.html'],
  ['/xspresso_dashboard.css','xspresso_dashboard.css'], ['/xspresso_dashboard_app_v1.js','xspresso_dashboard_app_v1.js']
]);
const TYPES = new Map([['.html','text/html; charset=utf-8'],['.css','text/css; charset=utf-8'],['.js','text/javascript; charset=utf-8']]);

/** Serves only the explicit dashboard asset allowlist and delegates API paths. */
export function createStaticWebHandler({ api, webRoot = DEFAULT_ROOT } = {}) {
  if (typeof api !== 'function') throw new TypeError('api handler is required.');
  const root = resolve(webRoot);
  return async function webHandler(req, res) {
    let url;
    try { url = new URL(req.url || '/', 'http://localhost'); }
    catch { return send(res, 400, 'Bad request.'); }
    if (url.pathname.startsWith('/api/') || url.pathname === '/api') return api(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return api(req, res);
    if (url.pathname === '/favicon.ico') { res.writeHead(204, { 'cache-control':'no-store' }); return res.end(); }
    const fileName = ASSETS.get(url.pathname);
    if (!fileName) return api(req, res);
    const fullPath = resolve(join(root, fileName));
    if (!fullPath.startsWith(`${root}/`) && fullPath !== root) return send(res, 404, 'Not found.');
    try {
      const data = await readFile(fullPath);
      const type = TYPES.get(fullPath.slice(fullPath.lastIndexOf('.')))||'application/octet-stream';
      const headers = {
        'content-type': type, 'content-length': data.length, 'cache-control': 'no-store',
        'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer',
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
      };
      res.writeHead(200, headers);
      return res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      return send(res, 500, 'Dashboard asset could not be read.');
    }
  };
}
function send(res, status, message) {
  const payload = Buffer.from(message);
  res.writeHead(status, { 'content-type':'text/plain; charset=utf-8', 'content-length':payload.length, 'cache-control':'no-store', 'x-content-type-options':'nosniff' });
  res.end(payload);
}
