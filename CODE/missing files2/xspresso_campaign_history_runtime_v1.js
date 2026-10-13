import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AuthRateLimiter } from './xspresso_auth_rate_limiter_v1.js';
import { createXspressoCampaignKitRuntime } from './xspresso_campaign_kit_runtime_v1.js';
import { CampaignHistoryService } from './xspresso_campaign_history_service_v1.js';
import { createCampaignHistoryApi } from './xspresso_campaign_history_api_v1.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const FILES = new Map([
  ['/','xspresso_dashboard_meta_connection_v2.html'],['/xspresso_dashboard_meta_connection_v2.html','xspresso_dashboard_meta_connection_v2.html'],
  ['/xspresso_dashboard_v2.css','xspresso_dashboard_v2.css'],['/xspresso_dashboard_app_v3_1.js','xspresso_dashboard_app_v3_1.js'],
  ['/xspresso_dashboard_api_client_v3.js','xspresso_dashboard_api_client_v3.js'],['/xspresso_meta_connection_panel_v2.js','xspresso_meta_connection_panel_v2.js'],
  ['/xspresso_meta_connection_api_v2.js','xspresso_meta_connection_api_v2.js'],['/xspresso_meta_connection_panel_v1.css','xspresso_meta_connection_panel_v1.css'],
  ['/xspresso_asset_library_panel_v1.js','xspresso_asset_library_panel_v1.js'],['/xspresso_ai_image_panel_v1.js','xspresso_ai_image_panel_v1.js'],['/xspresso_campaign_kit_download_panel_v1.js','xspresso_campaign_kit_download_panel_v1.js'],['/xspresso_campaign_history_panel_v1.js','xspresso_campaign_history_panel_v1.js']
]);
const MIME = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8' };
const json = (res,status,value) => { const b=JSON.stringify(value); res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','content-length':Buffer.byteLength(b),'x-content-type-options':'nosniff'}); res.end(b); };

export function createXspressoCampaignHistoryRuntime(options = {}) {
  const base = createXspressoCampaignKitRuntime(options);
  const config = options.config || base.config;
  const history = new CampaignHistoryService({ store: base.store });
  const api = createCampaignHistoryApi({ auth: base.auth, history, fallback: base.api });
  const root = options.webRoot || ROOT;
  const limiter = new AuthRateLimiter({ maxAttempts: 10, windowMs: 60_000 });
  const handler = async (req,res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname.startsWith('/api/')) return api(req,res);
    if (!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'METHOD_NOT_ALLOWED'});
    const filename = FILES.get(url.pathname); if (!filename) return json(res,404,{error:'NOT_FOUND'});
    try {
      let body = await readFile(join(root,filename));
      if (filename === 'xspresso_dashboard_meta_connection_v2.html') body = Buffer.from(body.toString('utf8').replace('</body>','<script type="module" src="/xspresso_campaign_history_panel_v1.js"></script></body>'));
      const ext = filename.slice(filename.lastIndexOf('.'));
      res.writeHead(200,{'content-type':MIME[ext]||'application/octet-stream','content-length':body.length,'cache-control':ext==='.html'?'no-store':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"});
      res.end(req.method==='HEAD'?undefined:body);
    } catch { return json(res,500,{error:'STATIC_FILE_ERROR'}); }
  };
  const server = createServer((req,res) => {
    res.setHeader('x-content-type-options','nosniff'); res.setHeader('referrer-policy','strict-origin-when-cross-origin');
    const path = new URL(req.url||'/','http://localhost').pathname;
    if (req.method==='POST' && ['/api/auth/login','/api/auth/signup','/api/integrations/meta/connect'].includes(path)) {
      const d=limiter.consume(req.socket?.remoteAddress||'unknown'); if(!d.allowed){res.writeHead(429,{'content-type':'application/json','retry-after':String(d.retryAfterSeconds)});return res.end(JSON.stringify({error:'RATE_LIMITED',message:'Try again later.'}));}
    }
    Promise.resolve(handler(req,res)).catch(()=>{if(!res.headersSent)json(res,500,{error:'INTERNAL_ERROR'});});
  });
  let listening=false;
  async function listen(){await base.store.init();await new Promise((ok,fail)=>{server.once('error',fail);server.listen(config.port,config.host,()=>{server.removeListener('error',fail);listening=true;ok();});});base.scheduler?.start?.();return server.address();}
  async function close(){await base.scheduler?.stop?.();if(listening)await new Promise((ok,fail)=>server.close(e=>e?fail(e):ok()));await base.close?.();}
  return {...base,server,api,historyService:history,listen,close};
}
async function main(){const app=createXspressoCampaignHistoryRuntime();const addr=await app.listen();console.log(`Xspresso campaign history runtime listening on ${addr.address}:${addr.port}`);for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>void app.close().finally(()=>process.exit(0)));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
