import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CampaignAssetService} from './xspresso_campaign_asset_service_v1.js';
function memoryStore(initial){let state=structuredClone(initial);return{async read(){return structuredClone(state);},async update(fn){const draft=structuredClone(state);const result=await fn(draft);state=draft;return structuredClone(result);},state(){return state;}};}
const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0,73,69,78,68]);
const user={id:'user_1',tenantId:'tenant_1'};
test('uploads a private PNG, attaches it to an owned campaign, and blocks cross-tenant reads',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'xspresso-assets-'));const store=memoryStore({campaigns:[{id:'camp_1',tenantId:'tenant_1',status:'draft',assets:{}}],campaignAssets:[]});
 try{const service=new CampaignAssetService({store,rootDir:join(dir,'assets')});const uploaded=await service.upload({user,campaignId:'camp_1',fileName:'hero.png',contentType:'image/png',buffer:png});assert.equal(uploaded.asset.fileName,'hero.png');assert.equal((await service.listForCampaign({user,campaignId:'camp_1'})).length,1);const loaded=await service.get({user,assetId:uploaded.asset.id});assert.deepEqual(loaded.buffer,png);await assert.rejects(()=>service.get({user:{id:'user_2',tenantId:'tenant_2'},assetId:uploaded.asset.id}),e=>e.status===404);assert.deepEqual(store.state().campaigns[0].assets.creativeAssetIds,[uploaded.asset.id]);}
 finally{await rm(dir,{recursive:true,force:true});}
});
test('rejects SVG and content-type spoofing',async()=>{const dir=await mkdtemp(join(tmpdir(),'xspresso-assets-'));const store=memoryStore({campaigns:[{id:'camp_1',tenantId:'tenant_1',status:'draft',assets:{}}]});try{const service=new CampaignAssetService({store,rootDir:join(dir,'assets')});await assert.rejects(()=>service.upload({user,campaignId:'camp_1',fileName:'x.svg',contentType:'image/svg+xml',buffer:Buffer.from('<svg></svg>')}),e=>e.status===415);await assert.rejects(()=>service.upload({user,campaignId:'camp_1',fileName:'x.jpg',contentType:'image/jpeg',buffer:png}),e=>e.status===415);}finally{await rm(dir,{recursive:true,force:true});}});
