import { createHash, randomUUID } from 'node:crypto';
import { buildCampaignMessages } from './xspresso_ai_prompt_builder_v1.js';
import { validateGeneratedCampaign } from './xspresso_ai_output_validation_v1.js';

const fault=(code,message,status,extra={})=>Object.assign(new Error(message),{code,message,status,...extra});
const tenantOf=user=>{if(!user?.id||!user?.tenantId)throw fault('UNAUTHENTICATED','Sign in to continue.',401);return user.tenantId;};

/** Creates a separate AI proposal. The current draft is not changed until the user explicitly applies it. */
export class CampaignIterationService {
  constructor({store,credits,provider,reviewService,creditCost=0,clock=()=>Date.now(),leaseMs=120_000}={}){
    if(!store?.read||!store?.update||!credits?.post||typeof provider?.generate!=='function'||typeof reviewService?.saveDraft!=='function') throw new TypeError('store, credits, provider.generate, and reviewService.saveDraft are required.');
    if(!Number.isSafeInteger(creditCost)||creditCost<0) throw new TypeError('creditCost must be a non-negative integer.');
    this.store=store;this.credits=credits;this.provider=provider;this.reviewService=reviewService;this.creditCost=creditCost;this.clock=clock;this.leaseMs=leaseMs;
  }

  async propose({user,campaignId,feedback,baseVersion,idempotencyKey}={}){
    const tenantId=tenantOf(user);
    if(typeof feedback!=='string'||feedback.trim().length<3||feedback.trim().length>2000) throw fault('INVALID_FEEDBACK','Feedback must be 3–2000 characters.',400);
    if(!Number.isSafeInteger(baseVersion)||baseVersion<0) throw fault('INVALID_DRAFT_VERSION','baseVersion must be a non-negative integer.',400);
    if(!/^[A-Za-z0-9._:-]{8,160}$/.test(String(idempotencyKey||''))) throw fault('IDEMPOTENCY_KEY_REQUIRED','Provide an Idempotency-Key of 8–160 safe characters.',400);
    const key=`${tenantId}:${campaignId}:${idempotencyKey}`;
    const cleanFeedback=feedback.trim();
    const claimId=randomUUID();
    const claim=await this.store.update(state=>{
      state.campaigns||=[];state.campaignIterationRequests||=[];state.campaignProposals||=[];
      const campaign=findCampaign(state,tenantId,campaignId);
      if(['active','published','running'].includes(campaign.status)) throw fault('CAMPAIGN_LOCKED','Pause the campaign before requesting a new draft.',409);
      const version=Number.isSafeInteger(campaign.draftVersion)?campaign.draftVersion:0;
      if(version!==baseVersion) throw fault('DRAFT_VERSION_CONFLICT','The draft changed. Refresh before asking for a revision.',409,{currentVersion:version});
      const currentDraft=campaign.assets?.generatedDraft;
      if(!currentDraft) throw fault('DRAFT_NOT_FOUND','Create a draft before requesting a revision.',409);
      const promptHash=createHash('sha256').update(JSON.stringify({feedback:cleanFeedback,baseVersion,currentDraft})).digest('hex');
      const prior=state.campaignIterationRequests.find(r=>r.key===key);
      if(prior&&prior.promptHash!==promptHash) throw fault('IDEMPOTENCY_KEY_REUSED','Use a new idempotency key for different feedback.',409);
      if(prior?.status==='complete') return {replay:true,proposalId:prior.proposalId};
      if(prior?.status==='processing'&&this.clock()-Date.parse(prior.updatedAt)<this.leaseMs) throw fault('ITERATION_IN_PROGRESS','This revision request is already processing.',409);
      const now=new Date(this.clock()).toISOString();
      if(prior) Object.assign(prior,{status:'processing',claimId,updatedAt:now,errorCode:null});
      else state.campaignIterationRequests.push({id:randomUUID(),key,tenantId,campaignId,promptHash,status:'processing',claimId,createdAt:now,updatedAt:now,proposalId:null});
      return {replay:false,claimId,promptHash,version,brief:structuredClone(campaign.brief||{}),platform:campaign.platform||'general',tone:user.tone||'simple',currentDraft:structuredClone(currentDraft)};
    });
    if(claim.replay){const proposal=await this.get({user,campaignId,proposalId:claim.proposalId});return {proposal,replayed:true,creditsCharged:0};}

    let charged=false;
    const chargeKey=`iteration:${key}:${claimId}`;
    try{
      if(this.creditCost>0){await this.credits.post({tenantId,actorId:user.id,kind:'debit',credits:this.creditCost,reason:'Campaign revision generation',referenceId:campaignId,idempotencyKey:chargeKey});charged=true;}
      const messages=buildCampaignMessages({brief:{...claim.brief,goal:claim.brief.goal},notes:cleanFeedback,tone:claim.tone,platform:claim.platform});
      messages.push({role:'user',content:JSON.stringify({task:'Revise the existing campaign draft according to the feedback. Return a complete replacement draft in the required schema. Preserve correct facts; do not publish or approve it.',feedback:cleanFeedback,currentDraft:claim.currentDraft})});
      const output=validateGeneratedCampaign(await this.provider.generate({messages,campaignId,tenantId,responseFormat:'json'}));
      const now=new Date(this.clock()).toISOString();
      const proposal=await this.store.update(state=>{
        const req=(state.campaignIterationRequests||[]).find(r=>r.key===key&&r.claimId===claim.claimId&&r.status==='processing');
        const campaign=findCampaign(state,tenantId,campaignId);
        const current=Number.isSafeInteger(campaign.draftVersion)?campaign.draftVersion:0;
        if(!req||current!==claim.version) throw fault('DRAFT_VERSION_CONFLICT','The draft changed while AI was working. Refresh and submit feedback again.',409,{currentVersion:current});
        const record={id:randomUUID(),tenantId,campaignId,baseVersion:claim.version,feedback:cleanFeedback,draft:output,status:'pending',createdBy:user.id,createdAt:now};
        state.campaignProposals.push(record);req.status='complete';req.proposalId=record.id;req.updatedAt=now;req.errorCode=null;
        state.auditEvents||=[];state.auditEvents.push({id:randomUUID(),tenantId,actorId:user.id,action:'campaign.revision_proposed',resourceType:'campaign',resourceId:campaignId,proposalId:record.id,baseVersion:claim.version,createdAt:now});
        return structuredClone(record);
      });
      return {proposal,replayed:false,creditsCharged:this.creditCost};
    }catch(error){
      if(charged){try{await this.credits.post({tenantId,actorId:user.id,kind:'refund',credits:this.creditCost,reason:'Refund for failed campaign revision',referenceId:campaignId,idempotencyKey:`refund:${chargeKey}`});}catch{error.refundError='REFUND_FAILED';}}
      await this.store.update(state=>{const req=(state.campaignIterationRequests||[]).find(r=>r.key===key&&r.claimId===claimId);if(req&&req.status==='processing'){req.status='failed';req.errorCode=error.code||'ITERATION_FAILED';req.updatedAt=new Date(this.clock()).toISOString();}});
      throw error;
    }
  }

  async list({user,campaignId}={}){const tenantId=tenantOf(user);const state=await this.store.read();findCampaign(state,tenantId,campaignId);return (state.campaignProposals||[]).filter(p=>p.tenantId===tenantId&&p.campaignId===campaignId).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(({id,baseVersion,feedback,status,createdBy,createdAt,appliedVersion})=>({id,baseVersion,feedback,status,createdBy,createdAt,appliedVersion:appliedVersion??null}));}

  async get({user,campaignId,proposalId}={}){const tenantId=tenantOf(user);const state=await this.store.read();findCampaign(state,tenantId,campaignId);const p=(state.campaignProposals||[]).find(row=>row.id===proposalId&&row.tenantId===tenantId&&row.campaignId===campaignId);if(!p)throw fault('PROPOSAL_NOT_FOUND','Proposal not found.',404);return structuredClone(p);}

  async apply({user,campaignId,proposalId,expectedVersion}={}){
    const tenantId=tenantOf(user);const proposal=await this.get({user,campaignId,proposalId});
    if(proposal.status!=='pending')throw fault('PROPOSAL_NOT_PENDING','Only a pending proposal can be applied.',409);
    if(expectedVersion!==proposal.baseVersion)throw fault('DRAFT_VERSION_CONFLICT','This proposal is based on an older draft. Generate a fresh revision.',409,{currentVersion:proposal.baseVersion});
    const saved=await this.reviewService.saveDraft({user,campaignId,expectedVersion,draft:proposal.draft});
    await this.store.update(state=>{const p=(state.campaignProposals||[]).find(row=>row.id===proposalId&&row.tenantId===tenantId&&row.campaignId===campaignId);if(!p||p.status!=='pending')throw fault('PROPOSAL_ALREADY_APPLIED','This proposal was already handled.',409);p.status='applied';p.appliedVersion=saved.version;p.appliedAt=new Date(this.clock()).toISOString();});
    return {proposalId,version:saved.version,reviewStatus:'needs_review',draft:saved.draft};
  }
}
function findCampaign(state,tenantId,id){const c=(state.campaigns||[]).find(r=>r.id===id&&r.tenantId===tenantId);if(!c)throw fault('CAMPAIGN_NOT_FOUND','Campaign not found.',404);return c;}
