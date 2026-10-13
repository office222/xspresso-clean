import { randomUUID } from 'node:crypto';

const fault=(status,code,message)=>Object.assign(new Error(message),{status,code});
function owner(user){if(!user?.id||!user?.tenantId)throw fault(401,'UNAUTHENTICATED','Sign in to continue.');return user;}
const labels={
 'campaign.created':'Campaign created','campaign.draft_saved':'Draft edited','campaign.draft_restored':'Earlier draft restored','campaign.approved':'Campaign draft approved','campaign.generated':'AI draft generated','campaign.proposal_created':'AI revision proposed','campaign.proposal_applied':'AI revision applied','campaign.external_linked':'External campaign linked','asset.uploaded':'Creative asset uploaded','image.generated':'AI image generated','metrics.csv_imported':'Metrics imported','meta.connected':'Meta account connected','meta.disconnected':'Meta account disconnected','followup.enrolled':'Lead enrolled in follow-up'
};
export class ActivityFeedService{
 constructor({store,clock=()=>Date.now()}={}){if(!store?.read||!store?.update)throw new TypeError('store.read and store.update are required.');this.store=store;this.clock=clock;}
 async list({user,limit=50,before}={}){
  const u=owner(user);if(!Number.isInteger(limit)||limit<1||limit>100)throw fault(400,'INVALID_LIMIT','limit must be from 1 to 100.');
  let beforeMs=Infinity;if(before){beforeMs=Date.parse(before);if(!Number.isFinite(beforeMs))throw fault(400,'INVALID_CURSOR','before must be an ISO date.');}
  const s=await this.store.read();const events=[];
  for(const e of s.auditEvents||[]){if(e.tenantId!==u.tenantId||!e.createdAt)continue;events.push({id:e.id||randomUUID(),kind:'audit',action:e.action||'activity.updated',title:labels[e.action]||String(e.action||'Activity').replace(/[._]/g,' '),campaignId:e.resourceType==='campaign'?e.resourceId:null,resourceType:e.resourceType||null,createdAt:e.createdAt,unread:Date.parse(e.createdAt)>(Date.parse(this.#lastRead(s,u))||0)});}
  for(const a of s.alerts||[]){if(a.tenantId!==u.tenantId||!a.createdAt)continue;events.push({id:`alert:${a.id}`,kind:'alert',action:a.status==='resolved'?'monitoring.alert_resolved':'monitoring.alert_opened',title:a.title||'Monitoring alert',campaignId:a.campaignId||null,resourceType:'alert',createdAt:a.updatedAt||a.createdAt,unread:Date.parse(a.updatedAt||a.createdAt)>(Date.parse(this.#lastRead(s,u))||0)});}
  for(const r of s.campaignRevisions||[]){if(r.tenantId!==u.tenantId||!r.createdAt)continue;const duplicate=events.some(e=>e.campaignId===r.campaignId&&e.createdAt===r.createdAt);if(duplicate)continue;events.push({id:`revision:${r.id}`,kind:'revision',action:`campaign.revision_${r.kind||'saved'}`,title:labels[`campaign.${r.kind}`]||`Campaign revision ${r.version}`,campaignId:r.campaignId,resourceType:'campaign_revision',createdAt:r.createdAt,unread:Date.parse(r.createdAt)>(Date.parse(this.#lastRead(s,u))||0)});}
  const ordered=events.filter(e=>Date.parse(e.createdAt)<beforeMs).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||String(b.id).localeCompare(String(a.id)));
  const items=ordered.slice(0,limit);return{items,unreadCount:events.filter(e=>e.unread).length,nextBefore:ordered.length>limit?items.at(-1)?.createdAt||null:null};
 }
 async markRead({user}={}){const u=owner(user);const at=new Date(this.clock()).toISOString();return this.store.update(s=>{s.activityReadMarkers||=[];let row=s.activityReadMarkers.find(x=>x.tenantId===u.tenantId&&x.userId===u.id);if(!row){row={tenantId:u.tenantId,userId:u.id};s.activityReadMarkers.push(row);}row.lastReadAt=at;return{lastReadAt:at};});}
 #lastRead(state,user){return(state.activityReadMarkers||[]).find(x=>x.tenantId===user.tenantId&&x.userId===user.id)?.lastReadAt||null;}
}
