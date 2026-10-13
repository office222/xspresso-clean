import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const assets = new Map([
  ['/','xspresso_dashboard_meta_connection_v2.html'],
  ['/xspresso_dashboard_meta_connection_v2.html','xspresso_dashboard_meta_connection_v2.html'],
  ['/xspresso_dashboard_v2.css','xspresso_dashboard_v2.css'],
  ['/xspresso_meta_connection_panel_v1.css','xspresso_meta_connection_panel_v1.css'],
  ['/xspresso_dashboard_api_client_v3.js','xspresso_dashboard_api_client_v3.js'],
  ['/xspresso_dashboard_app_v3_1.js','xspresso_dashboard_app_v3_1.js'],
  ['/xspresso_meta_connection_api_v2.js','xspresso_meta_connection_api_v2.js'],
  ['/xspresso_meta_connection_panel_v2.js','xspresso_meta_connection_panel_v2.js'],
]);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8' };

export function createXspressoMetaConnectionStaticHandler({ api, webRoot = ROOT } = {}) {
  if (typeof api !== 'function') throw new TypeError('api handler is required');
  const root = resolve(webRoot);
  return async function staticHandler(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname.startsWith('/api/')) return api(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return api(req, res);
    const name = assets.get(url.pathname);
    if (!name) return api(req, res);
    const path = resolve(join(root, name));
    if (!path.startsWith(root + '/') && path !== root) {
      res.writeHead(400, { 'content-type':'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error:'Invalid asset path.' }));
    }
    try {
      const body = await readFile(path);
      const ext = name.slice(name.lastIndexOf('.'));
      res.writeHead(200, {
        'content-type': types[ext] || 'application/octet-stream',
        'content-length': body.length,
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
        'x-frame-options': 'DENY',
      });
      return res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      res.writeHead(404, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' });
      return res.end(JSON.stringify({ error:'Asset not found.' }));
    }
  };
}
