import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createXspressoEmailRuntime } from './xspresso_email_openai_runtime_v1.js';
import { MetaTenantTokenVault } from './xspresso_meta_tenant_token_v1.js';
import { MetaGraphReadClient } from './xspresso_meta_graph_read_client_v1.js';
import { MetaInsightsMetricsProvider } from './xspresso_meta_insights_metrics_provider_v1.js';
import { ImportedMetricsProvider } from './xspresso_imported_metrics_provider_v1.js';
import { CampaignMetricsImportService } from './xspresso_campaign_metrics_import_service_v1.js';
import { createCampaignMetricsImportApi } from './xspresso_campaign_metrics_import_api_v1.js';
import { createOperationsApiHandler } from './xspresso_operations_api_handler_v1.js';
import { AlertRepository } from './xspresso_alert_repository_v1.js';
import { MonitoringWorker } from './xspresso_monitoring_worker_v1.js';
import { evaluateAdMetrics } from './xspresso_monitoring_rule_engine_v1.js';
import { createXspressoStaticHandlerV3_1 } from './xspresso_static_web_handler_v3_1.js';
import { AuthRateLimiter } from './xspresso_auth_rate_limiter_v1.js';
function send(res,status,value,headers={}){const text=JSON.stringify(value);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(text),'cache-control':'no-store',...headers});res.end(text);}

/** Read-only Meta Insights runtime, with CSV fallback and no remote write methods. */
export function createXspressoMetaMetricsRuntime(options={}){
  const backend=createXspressoEmailRuntime(options),store=backend.store,env=options.env||process.env;
  const csvProvider=new ImportedMetricsProvider({store});
  let tokenVault=null,metaProvider=null;
  if(env.XSPRESSO_CREDENTIALS_ENCRYPTION_KEY){
    tokenVault=new MetaTenantTokenVault({store,encryptionKey:env.XSPRESSO_CREDENTIALS_ENCRYPTION_KEY});
    const version=String(env.XSPRESSO_META_GRAPH_API_VERSION||'');
    if(version) metaProvider=new MetaInsightsMetricsProvider({store,vault:tokenVault,graphClient:new MetaGraphReadClient({apiVersion:version,fetchImpl:options.fetchImpl}),conversionActionTypes:String(env.XSPRESSO_META_CONVERSION_ACTION_TYPES||'').split(',')});
  }
  const metricsProvider={async getCampaignMetrics(input){
    const state=await store.read(),campaign=(state.campaigns||[]).find(x=>x.id===input.campaignId&&x.tenantId===input.tenantId);
    if(!campaign)throw Object.assign(new Error('Campaign not found.'),{status:404,code:'CAMPAIGN_NOT_FOUND'});
    if(campaign.platform==='meta'&&metaProvider){try{return await metaProvider.getCampaignMetrics(input);}catch(error){if(error.code!=='META_NOT_CONNECTED')throw error;}}
    return csvProvider.getCampaignMetrics(input);
  }};
  const importService=new CampaignMetricsImportService({store});
  const alertRepository=new AlertRepository({store});
  const ruleEngine={evaluateAdMetrics(metrics,thresholds={}){const safe=metrics?.conversionTrackingConfigured===false?{...thresholds,clicksWithoutConversion:Number.MAX_SAFE_INTEGER}:thresholds;return evaluateAdMetrics(metrics,safe);}};
  const monitoringWorker=new MonitoringWorker({store,metricsProvider,ruleEngine,alerts:alertRepository});
  const metricsApi=createCampaignMetricsImportApi({auth:backend.auth,importService,metricsProvider,fallback:backend.api});
  const api=createOperationsApiHandler({auth:backend.auth,monitoringWorker,alertRepository,followups:backend.followups,fallback:metricsApi});
  const webHandler=createXspressoStaticHandlerV3_1({api,webRoot:options.webRoot});
  const limiter=new AuthRateLimiter({maxAttempts:12,windowMs:60_000});
  const server=createServer((req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');
    const path=new URL(req.url||'/','http://localhost').pathname;
    if(req.method==='POST'&&['/api/auth/login','/api/auth/signup','/api/auth/register'].includes(path)){const d=limiter.consume(req.socket?.remoteAddress||'unknown');if(!d.allowed)return send(res,429,{error:'RATE_LIMITED',message:'Too many authentication attempts.'},{'Retry-After':String(d.retryAfterSeconds)});}
    Promise.resolve(webHandler(req,res)).catch(error=>{if(res.headersSent)return res.destroy(error);const status=Number.isInteger(error?.status)?error.status:500;send(res,status,{error:error?.code||'INTERNAL_ERROR',message:status>=500?'The request could not be completed.':error.message});});
  });
  let listening=false;
  return {...backend,api,server,metricsProvider,monitoringWorker,alertRepository,tokenVault,metaConnected:Boolean(tokenVault&&metaProvider),
    async listen(){await store.init();const address=await new Promise((ok,no)=>{const fail=e=>{server.off('listening',ready);no(e);},ready=()=>{server.off('error',fail);ok(server.address());};server.once('error',fail);server.once('listening',ready);server.listen((options.config||backend.config).port,(options.config||backend.config).host);});listening=true;backend.scheduler?.start?.();return address;},
    async close(){backend.scheduler?.stop&&await backend.scheduler.stop();if(listening)await new Promise((ok,no)=>server.close(e=>e?no(e):ok()));listening=false;await backend.close?.();await backend.mailer?.close?.();}
  };
}
async function main(){const runtime=createXspressoMetaMetricsRuntime(),address=await runtime.listen();console.log(`Xspresso read-only Meta/CSV metrics runtime listening on ${address.address}:${address.port}`);console.log(`Meta Insights: ${runtime.metaConnected?'configured':'not configured; CSV import remains available'}`);const stop=async()=>{await runtime.close();process.exit(0);};process.once('SIGINT',stop);process.once('SIGTERM',stop);}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error('Xspresso startup failed:',e.message);process.exitCode=1;});
