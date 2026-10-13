import { createHash } from 'node:crypto';

const fail=(code,message,status)=>Object.assign(new Error(message),{code,status});
export class ApprovedCampaignKitService {
  constructor({store,clock=Date.now}={}){if(!store)throw new TypeError('store is required');this.store=store;this.clock=clock;}
  async build({user,campaignId}={}){
    if(!user?.id||!user?.tenantId)throw fail('UNAUTHENTICATED','Sign in first.',401);
    const state=await this.store.read();
    const campaign=(state.campaigns||[]).find(c=>c.id===campaignId&&c.tenantId===user.tenantId);
    if(!campaign)throw fail('CAMPAIGN_NOT_FOUND','Campaign not found.',404);
    const version=Number.isSafeInteger(campaign.draftVersion)?campaign.draftVersion:0;
    if(campaign.reviewStatus!=='approved'||!campaign.approval||campaign.approval.draftVersion!==version||!campaign.assets?.approvedDraft)
      throw fail('APPROVAL_REQUIRED','Approve the current draft before exporting a campaign kit.',409);
    const ids=new Set(campaign.assets.creativeAssetIds||[]);
    const assets=(state.campaignAssets||[]).filter(a=>a.tenantId===user.tenantId&&a.campaignId===campaign.id&&ids.has(a.id));
    const safeAssets=assets.map(a=>({id:a.id,fileName:a.fileName,contentType:a.contentType,bytes:a.bytes,sha256:a.sha256,downloadPath:`/api/assets/${encodeURIComponent(a.id)}`}));
    return {
      schema:'xspresso.approved-campaign-kit.v1',
      exportedAt:new Date(this.clock()).toISOString(),
      handoffOnly:true,
      publishingPerformed:false,
      campaign:{id:campaign.id,name:campaign.name||'',goal:campaign.goal||'',platform:campaign.platform||null,externalCampaignId:campaign.externalCampaignId||null},
      approval:{approvedBy:campaign.approval.approvedBy,approvedAt:campaign.approval.approvedAt,draftVersion:version},
      copy:structuredClone(campaign.assets.approvedDraft),
      creativeAssets:safeAssets
    };
  }
}
