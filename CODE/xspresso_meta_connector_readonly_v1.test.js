import test from 'node:test';
import assert from 'node:assert/strict';
import { MetaTenantTokenVault } from './xspresso_meta_tenant_token_v1.js';
import { MetaGraphReadClient } from './xspresso_meta_graph_read_client_v1.js';
import { MetaInsightsMetricsProvider } from './xspresso_meta_insights_metrics_provider_v1.js';

function memoryStore(seed={}){let state=structuredClone(seed);return{async read(){return structuredClone(state);},async update(fn){const draft=structuredClone(state);const value=await fn(draft);state=draft;return structuredClone(value);},state:()=>state};}
const key=Buffer.alloc(32,9).toString('base64');

test('tenant Meta credentials are encrypted at rest and can be removed',async()=>{
  const store=memoryStore({});const vault=new MetaTenantTokenVault({store,encryptionKey:key});
  await vault.set({tenantId:'tenant-1',adAccountId:'123456789',currency:'USD',accessToken:'EAAB-secret-token-value-0123456789'});
  const serialized=JSON.stringify(store.state());assert.equal(serialized.includes('EAAB-secret-token-value-0123456789'),false);
  assert.equal((await vault.get('tenant-1')).accessToken,'EAAB-secret-token-value-0123456789');
  assert.deepEqual(await vault.remove('tenant-1'),{removed:true});
  await assert.rejects(()=>vault.get('tenant-1'),e=>e.code==='META_NOT_CONNECTED');
});

test('read client requests Insights with GET and rejects redirects/errors without leaking tokens',async()=>{
  let captured;const client=new MetaGraphReadClient({apiVersion:'v99.0',fetchImpl:async(url,init)=>{captured={url:String(url),init};return new Response(JSON.stringify({data:[{ad_id:'ad-1',impressions:'100',clicks:'8',spend:'2.50',actions:[{action_type:'lead',value:'2'}]}]}),{status:200});}});
  const rows=await client.getCampaignInsights({adAccountId:'123456789',campaignId:'987654321',accessToken:'EAAB-secret-token-value-0123456789',since:'2026-10-01',until:'2026-10-09'});
  assert.equal(rows.length,1);assert.equal(captured.init.method,'GET');assert.equal(captured.init.redirect,'error');
  const url=new URL(captured.url);assert.match(url.pathname,/\/act_123456789\/insights$/);assert.equal(url.searchParams.get('level'),'ad');assert.equal(url.searchParams.get('filtering').includes('987654321'),true);
});

test('provider maps configured conversions and suppresses unconfigured conversion signals',async()=>{
  const store=memoryStore({campaigns:[{id:'campaign-1',tenantId:'tenant-1',platform:'meta',externalCampaignId:'987654321'}]});
  const vault={async get(){return{adAccountId:'123456789',currency:'USD',accessToken:'x'.repeat(30)};}};
  const graphClient={async getCampaignInsights(){return[{ad_id:'ad-1',ad_name:'Ad',impressions:'100',clicks:'8',spend:'2.50',actions:[{action_type:'lead',value:'2'}]}];}};
  const provider=new MetaInsightsMetricsProvider({store,vault,graphClient,conversionActionTypes:['lead'],clock:()=>Date.parse('2026-10-09T12:00:00Z')});
  const result=await provider.getCampaignMetrics({tenantId:'tenant-1',campaignId:'campaign-1'});
  assert.equal(result.source,'meta_insights');assert.equal(result.ads[0].metrics.conversions,2);assert.equal(result.ads[0].metrics.conversionTrackingConfigured,true);
  const noMapping=new MetaInsightsMetricsProvider({store,vault,graphClient,clock:()=>Date.parse('2026-10-09T12:00:00Z')});
  const unknown=await noMapping.getCampaignMetrics({tenantId:'tenant-1',campaignId:'campaign-1'});
  assert.equal(unknown.ads[0].metrics.conversionTrackingConfigured,false);
});
