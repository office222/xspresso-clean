import {createServer} from 'node:http';
import {dirname,join} from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {AuthRateLimiter} from './xspresso_auth_rate_limiter_v1.js';
import {createXspressoOpenAIImageRuntime} from './xspresso_openai_image_runtime_v1.js';
import {ApprovedCampaignKitService} from './xspresso_approved_campaign_kit_service_v1.js';
import {createApprovedCampaignKitApi} from './xspresso_approved_campaign_kit_api_v1.js';
const ROOT=dirname(fileURLToPath(import.meta.url));
const FILES=new Map([
 ['/','xspresso_dashboard_meta_connection_v2.html'],['/xspresso_dashboard_meta_connection_v2.html','xspresso_dashboard_meta_connection_v2.html'],
 ['/xspresso_dashboard_v2.css','xspresso_dashboard_v2.css'],['/xspresso_dashboard_app_v3_1.js','xspresso_dashboard_app_v3_1.js'],
 ['/xspresso_dashboard_api_client_v3.js','xspresso_dashboard_api_client_v3.js'],['/xspresso_meta_connection_panel_v2.js','xspresso_meta_connection_panel_v2.js'],
 ['/xspresso_meta_connection_api_v2.js','xspresso_meta_connection_api_v2.js'],['/xspresso_meta_connection_panel_v1.css','xspresso_meta_connection_panel_v1.css'],
 ['/xspresso_asset_library_panel_v1.js','xspresso_asset_library_panel_v1.js'],['/xspresso_ai_image_panel_v1.js','xspresso_ai_image_panel_v1.js'],['/xspresso_campaign_kit_download_panel_v1.js','xspresso_campaign_kit_download_panel_v1.js']
]);
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));};
export function createXspressoCampaignKitRuntime(options={}){
 const backend=createXspressoOpenAIImageRuntime(options);const config=options.config||backend.config;const root=options.webRoot||ROOT;
 const service=new ApprovedCampaignKitService({store:backend.store});
 const api=createApprovedCampaignKitApi({auth:backend.auth,service,fallback:backend.api});
 const web=async(req,res)=>{const url=new URL(req.url||'/','http://localhost');if(url.pathname.startsWith('/api/'))return api(req,res);if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'METHOD_NOT_ALLOWED'});const name=FILES.get(url.pathname);if(!name)return json(res,404,{error:'NOT_FOUND'});try{let body=await readFile(join(root,name));if(name==='xspresso_dashboard_meta_connection_v2.html'){body=Buffer.from(body.toString('utf8').replace('</body>','<script type="module" src="/xspresso_campaign_kit_download_panel_v1.js"></script></body>'));}const ext=name.slice(name.lastIndexOf('.'));res.writeHead(200,{'content-type':MIME[ext]||'application/octet-stream','content-length':body.length,'cache-control':ext==='.html'?'no-store':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:body);}catch{return json(res,500,{error:'STATIC_FILE_ERROR'});}};
 const limiter=new AuthRateLimiter({maxAttempts:10,windowMs:60_000});let listening=false;
 const server=createServer((req,res)=>{res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','strict-origin-when-cross-origin');const path=new URL(req.url||'/','http://localhost').pathname;if(req.method==='POST'&&['/api/auth/login','/api/auth/signup','/api/integrations/meta/connect'].includes(path)){const d=limiter.consume(req.socket?.remoteAddress||'unknown');if(!d.allowed){res.writeHead(429,{'content-type':'application/json','retry-after':String(d.retryAfterSeconds)});return res.end(JSON.stringify({error:'RATE_LIMITED',message:'Try again later.'}));}}Promise.resolve(web(req,res)).catch(()=>{if(!res.headersSent)json(res,500,{error:'INTERNAL_ERROR'});});});
 async function listen(){await backend.store.init();await new Promise((ok,fail)=>{server.once('error',fail);server.listen(config.port,config.host,()=>{server.removeListener('error',fail);listening=true;ok();});});backend.scheduler?.start?.();return server.address();}
 async function close(){await backend.scheduler?.stop?.();if(listening)await new Promise((ok,fail)=>server.close(e=>e?fail(e):ok()));await backend.close?.();await backend.mailer?.close?.();}
 return{...backend,server,api,kitService:service,listen,close};
}
async function main(){const app=createXspressoCampaignKitRuntime();const a=await app.listen();console.log(`Xspresso campaign-kit runtime listening on ${a.address}:${a.port}`);for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>void app.close().finally(()=>process.exit(0)));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
