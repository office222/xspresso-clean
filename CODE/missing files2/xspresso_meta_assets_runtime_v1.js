import {createServer} from 'node:http';
import {dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createXspressoMetaOAuthRuntime} from './xspresso_meta_oauth_runtime_v1.js';
import {CampaignAssetService} from './xspresso_campaign_asset_service_v1.js';
import {createCampaignAssetApiHandler} from './xspresso_campaign_asset_api_v1.js';
import {createXspressoAssetStaticHandler} from './xspresso_meta_asset_static_handler_v1.js';
import {AuthRateLimiter} from './xspresso_auth_rate_limiter_v1.js';
export function createXspressoMetaAssetRuntime(options={}){
 const backend=createXspressoMetaOAuthRuntime(options);const config=options.config||backend.config;const root=options.assetRoot||join(dirname(config.dataFile),'campaign-assets');
 const assetService=new CampaignAssetService({store:backend.store,rootDir:root,maxBytes:options.maxAssetBytes||12*1024*1024});
 const api=createCampaignAssetApiHandler({auth:backend.auth,assetService,fallback:backend.api,bodyLimitBytes:options.maxAssetBytes||12*1024*1024});
 const webHandler=createXspressoAssetStaticHandler({api,webRoot:options.webRoot});const server=createServer((req,res)=>{
  res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','strict-origin-when-cross-origin');
  const path=new URL(req.url||'/','http://localhost').pathname;const authPath=req.method==='POST'&&['/api/auth/login','/api/auth/signup','/api/integrations/meta/connect'].includes(path);
  if(authPath){const d=limiter.consume(req.socket?.remoteAddress||'unknown');if(!d.allowed){res.writeHead(429,{'content-type':'application/json','retry-after':String(d.retryAfterSeconds)});return res.end(JSON.stringify({error:'RATE_LIMITED',message:'Try again later.'}));}}
  Promise.resolve(webHandler(req,res)).catch(()=>{if(!res.headersSent){res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({error:'INTERNAL_ERROR'}));}});
 });
 const limiter=new AuthRateLimiter({maxAttempts:12,windowMs:60_000});let listening=false;
 async function listen(){await backend.store.init();await new Promise((ok,fail)=>{server.once('error',fail);server.listen(config.port,config.host,()=>{server.removeListener('error',fail);listening=true;ok();});});backend.scheduler?.start?.();return server.address();}
 async function close(){await backend.scheduler?.stop?.();if(listening)await new Promise((ok,fail)=>server.close(e=>e?fail(e):ok()));await backend.close?.();}
 return{...backend,server,api,assetService,listen,close};
}
async function main(){const app=createXspressoMetaAssetRuntime();const address=await app.listen();console.log(`Xspresso listening on ${address.address}:${address.port}`);for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>void app.close().finally(()=>process.exit(0)));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
