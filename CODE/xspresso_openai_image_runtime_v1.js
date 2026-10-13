import {createServer} from 'node:http';
import {dirname,join} from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {AuthRateLimiter} from './xspresso_auth_rate_limiter_v1.js';
import {createXspressoMetaAssetRuntime} from './xspresso_meta_assets_runtime_v1.js';
import {CampaignImageGenerationService,createOpenAIImageProviderFromEnv} from './xspresso_openai_image_generation_core_v1.js';
import {CreditLedgerService} from './xspresso_credit_ledger_service_v1.js';
import {createCampaignImageApiHandler} from './xspresso_campaign_image_generation_api_v1.js';

const ROOT=dirname(fileURLToPath(import.meta.url));
const FILES=new Map([
 ['/','xspresso_dashboard_meta_connection_v2.html'],['/xspresso_dashboard_meta_connection_v2.html','xspresso_dashboard_meta_connection_v2.html'],
 ['/xspresso_dashboard_v2.css','xspresso_dashboard_v2.css'],['/xspresso_dashboard_app_v3_1.js','xspresso_dashboard_app_v3_1.js'],
 ['/xspresso_dashboard_api_client_v3.js','xspresso_dashboard_api_client_v3.js'],['/xspresso_meta_connection_panel_v2.js','xspresso_meta_connection_panel_v2.js'],
 ['/xspresso_meta_connection_api_v2.js','xspresso_meta_connection_api_v2.js'],['/xspresso_meta_connection_panel_v1.css','xspresso_meta_connection_panel_v1.css'],
 ['/xspresso_asset_library_panel_v1.js','xspresso_asset_library_panel_v1.js'],['/xspresso_ai_image_panel_v1.js','xspresso_ai_image_panel_v1.js']
]);
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const json=(res,status,x)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(x));};
function staticHandler({api,webRoot=ROOT}){return async(req,res)=>{const url=new URL(req.url||'/','http://localhost');if(url.pathname.startsWith('/api/'))return api(req,res);if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'METHOD_NOT_ALLOWED'});const name=FILES.get(url.pathname);if(!name)return json(res,404,{error:'NOT_FOUND'});try{let body=await readFile(join(webRoot,name));if(name==='xspresso_dashboard_meta_connection_v2.html'){const scripts='<script type="module" src="/xspresso_asset_library_panel_v1.js"></script><script type="module" src="/xspresso_ai_image_panel_v1.js"></script>';body=Buffer.from(body.toString('utf8').replace('</body>',`${scripts}</body>`));}const ext=name.slice(name.lastIndexOf('.'));res.writeHead(200,{'content-type':MIME[ext]||'application/octet-stream','content-length':body.length,'cache-control':ext==='.html'?'no-store':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"});return res.end(req.method==='HEAD'?undefined:body);}catch{return json(res,500,{error:'STATIC_FILE_ERROR'});}};}
export function createXspressoOpenAIImageRuntime(options={}){
 const backend=createXspressoMetaAssetRuntime(options);const config=options.config||backend.config;const env=options.env||process.env;
 const provider=createOpenAIImageProviderFromEnv(env,{fetchImpl:options.fetchImpl||globalThis.fetch});
 const rawCost=env.XSPRESSO_IMAGE_GENERATION_CREDIT_COST;let creditCost=0;
 if(rawCost!==undefined){creditCost=Number(rawCost);if(!Number.isSafeInteger(creditCost)||creditCost<0)throw new Error('XSPRESSO_IMAGE_GENERATION_CREDIT_COST must be a nonnegative integer.');}
 else if(env.NODE_ENV==='production'&&provider)throw new Error('Set XSPRESSO_IMAGE_GENERATION_CREDIT_COST in production.');
 const credits=new CreditLedgerService({store:backend.store});
 const imageService=new CampaignImageGenerationService({store:backend.store,assetService:backend.assetService,provider,credits,creditCost});
 const api=createCampaignImageApiHandler({auth:backend.auth,imageService,fallback:backend.api});
 const web=staticHandler({api,webRoot:options.webRoot||ROOT});
 const limiter=new AuthRateLimiter({maxAttempts:10,windowMs:60_000});let listening=false;
 const server=createServer((req,res)=>{res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','strict-origin-when-cross-origin');const p=new URL(req.url||'/','http://localhost').pathname;const limited=(req.method==='POST'&&p.startsWith('/api/campaigns/')&&p.endsWith('/images/generate'))||(req.method==='POST'&&['/api/auth/login','/api/auth/signup','/api/integrations/meta/connect'].includes(p));if(limited){const d=limiter.consume(req.socket?.remoteAddress||'unknown');if(!d.allowed){res.writeHead(429,{'content-type':'application/json','retry-after':String(d.retryAfterSeconds)});return res.end(JSON.stringify({error:'RATE_LIMITED',message:'Try again later.'}));}}Promise.resolve(web(req,res)).catch(()=>{if(!res.headersSent)json(res,500,{error:'INTERNAL_ERROR'});});});
 async function listen(){await backend.store.init();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port,config.host,()=>{server.removeListener('error',reject);listening=true;resolve();});});backend.scheduler?.start?.();return server.address();}
 async function close(){await backend.scheduler?.stop?.();if(listening)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));await backend.close?.();await backend.mailer?.close?.();}
 return{...backend,server,api,imageService,imageProvider:provider,listen,close};
}
async function main(){const app=createXspressoOpenAIImageRuntime();const a=await app.listen();console.log(`Xspresso image runtime listening on ${a.address}:${a.port}`);for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>void app.close().finally(()=>process.exit(0)));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
