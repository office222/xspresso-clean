import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignHistoryService } from './xspresso_campaign_history_service_v1.js';

const draft = { headline:'A simple headline', subheadline:'A short supporting line', hooks:['Try it today'], ads:[{headline:'Shop now',primaryText:'A clear product benefit',callToAction:'Shop now'}], landingPage:{headline:'Welcome',body:'Product details.'}, followUpEmails:[{subject:'Thanks for your interest',body:'Here is more information.',delayDays:1}] };
function memoryStore(initial){let state=structuredClone(initial);return{read:async()=>structuredClone(state),update:async fn=>{const next=structuredClone(state);const out=await fn(next);state=next;return structuredClone(out);},state:()=>state};}
const user={id:'user-1',tenantId:'tenant-1'};

test('lists tenant-scoped revisions and restores a prior draft as a new unapproved version',async()=>{
 const store=memoryStore({campaigns:[{id:'camp-1',tenantId:'tenant-1',status:'draft',draftVersion:2,reviewStatus:'approved',approval:{draftVersion:2},assets:{generatedDraft:draft,approvedDraft:draft}}],campaignRevisions:[{id:'rev-1',tenantId:'tenant-1',campaignId:'camp-1',version:1,kind:'edited',draft:{...draft,headline:'Earlier headline'},actorId:'user-1',createdAt:'2026-10-01T00:00:00.000Z'}],auditEvents:[]});
 const service=new CampaignHistoryService({store,clock:()=>Date.parse('2026-10-09T12:00:00.000Z')});
 assert.equal((await service.list({user,campaignId:'camp-1'})).length,1);
 const result=await service.restore({user,campaignId:'camp-1',revisionId:'rev-1',expectedVersion:2});
 assert.equal(result.version,3); assert.equal(result.reviewStatus,'needs_review'); assert.equal(result.draft.headline,'Earlier headline');
 const state=await store.read(); assert.equal(state.campaigns[0].approval,null); assert.equal(state.campaignRevisions.at(-1).kind,'restored'); assert.equal(state.campaignRevisions.at(-1).sourceRevisionId,'rev-1');
});

test('rejects cross-tenant reads and stale restore versions',async()=>{
 const store=memoryStore({campaigns:[{id:'camp-1',tenantId:'tenant-1',status:'draft',draftVersion:2,assets:{generatedDraft:draft}}],campaignRevisions:[{id:'rev-1',tenantId:'tenant-1',campaignId:'camp-1',version:1,kind:'edited',draft,createdAt:'2026-10-01T00:00:00.000Z'}]});
 const service=new CampaignHistoryService({store});
 await assert.rejects(service.get({user:{id:'other',tenantId:'tenant-2'},campaignId:'camp-1',revisionId:'rev-1'}),e=>e.status===404);
 await assert.rejects(service.restore({user,campaignId:'camp-1',revisionId:'rev-1',expectedVersion:1}),e=>e.status===409&&e.code==='DRAFT_VERSION_CONFLICT');
});

test('prevents restoring campaigns already in an active state',async()=>{
 const store=memoryStore({campaigns:[{id:'camp-1',tenantId:'tenant-1',status:'active',draftVersion:2,assets:{generatedDraft:draft}}],campaignRevisions:[{id:'rev-1',tenantId:'tenant-1',campaignId:'camp-1',version:1,kind:'edited',draft,createdAt:'2026-10-01T00:00:00.000Z'}]});
 const service=new CampaignHistoryService({store});
 await assert.rejects(service.restore({user,campaignId:'camp-1',revisionId:'rev-1',expectedVersion:2}),e=>e.status===409&&e.code==='CAMPAIGN_LOCKED');
});
