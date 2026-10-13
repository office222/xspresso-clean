import test from 'node:test';
import assert from 'node:assert/strict';
import {OpenAIImageProvider,CampaignImageGenerationService} from './xspresso_openai_image_generation_core_v1.js';

const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
function memoryStore(initial){let state=structuredClone(initial);return{read:async()=>structuredClone(state),update:async(fn)=>{const draft=structuredClone(state);const result=await fn(draft);state=draft;return structuredClone(result);},state:()=>state};}
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});

test('OpenAI image provider requests one configured image and decodes base64 output',async()=>{
 let called=0;const provider=new OpenAIImageProvider({apiKey:'test-key',model:'test-image-model',fetchImpl:async(url,init)=>{called++;assert.equal(url,'https://api.openai.com/v1/images/generations');assert.equal(init.method,'POST');assert.equal(init.headers.authorization,'Bearer test-key');const body=JSON.parse(init.body);assert.equal(body.n,1);assert.equal(body.output_format,'png');return response({data:[{b64_json:png.toString('base64')}]});}});
 const result=await provider.generate({prompt:'Minimal blue product image'});assert.equal(called,1);assert.equal(result.contentType,'image/png');assert.deepEqual(result.buffer,png);
});

test('image generation is tenant-scoped and idempotent',async()=>{
 const store=memoryStore({campaigns:[{id:'campaign_1',tenantId:'tenant_1',assets:{}}],imageGenerationRequests:[]});let calls=0;const asset={id:'asset_1',fileName:'creative.png',contentType:'image/png',bytes:png.length};
 const service=new CampaignImageGenerationService({store,provider:{generate:async()=>{calls++;return{buffer:png,contentType:'image/png',format:'png'};}},assetService:{upload:async()=>({asset,duplicate:false})},clock:()=>Date.parse('2026-10-09T12:00:00.000Z')});
 const args={user:{id:'user_1',tenantId:'tenant_1'},campaignId:'campaign_1',prompt:'An elegant product image',idempotencyKey:'image-request-0001'};
 const first=await service.generate(args);const second=await service.generate(args);assert.equal(first.asset.id,'asset_1');assert.equal(first.replayed,false);assert.equal(second.replayed,true);assert.equal(calls,1);
 await assert.rejects(()=>service.generate({...args,user:{id:'other',tenantId:'tenant_2'}}),e=>e.status===404);
});

test('provider errors are sanitized',async()=>{
 const provider=new OpenAIImageProvider({apiKey:'secret-key',model:'test',fetchImpl:async()=>response({error:{message:'secret details'}},500)});
 await assert.rejects(()=>provider.generate({prompt:'A safe image'}),e=>e.status===502&&e.message==='Image generation failed.'&&!e.message.includes('secret'));
});
