import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const fault=(status,code,message)=>Object.assign(new Error(message),{status,code});
const safeId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
function sniffImage(b){
  if(b.length>=8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return{type:'image/png',ext:'png'};
  if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255)return{type:'image/jpeg',ext:'jpg'};
  if(b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return{type:'image/webp',ext:'webp'};
  return null;
}
function publicAsset(a){const{relativePath,...safe}=a;return safe;}

export class CampaignAssetService {
  constructor({store,rootDir,maxBytes=12*1024*1024,clock=Date.now,idFactory=randomUUID}){
    if(!store||!rootDir)throw new TypeError('store and rootDir are required');
    this.store=store;this.rootDir=resolve(rootDir);this.maxBytes=maxBytes;this.clock=clock;this.idFactory=idFactory;
  }
  async upload({user,campaignId,fileName,contentType,buffer}){
    const tenantId=user?.tenantId;
    if(!safeId(tenantId)||!safeId(campaignId))throw fault(400,'INVALID_SCOPE','Invalid tenant or campaign.');
    const bytes=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer||[]);
    if(bytes.length<12||bytes.length>this.maxBytes)throw fault(413,'ASSET_SIZE_INVALID','Image must be between 12 bytes and the configured size limit.');
    const detected=sniffImage(bytes);
    if(!detected||detected.type!==String(contentType||'').split(';')[0].trim().toLowerCase())throw fault(415,'IMAGE_TYPE_INVALID','Only matching PNG, JPEG, or WebP images are accepted.');
    const hash=createHash('sha256').update(bytes).digest('hex');
    const current=await this.store.read();
    const campaign=(current.campaigns||[]).find(c=>c.id===campaignId&&c.tenantId===tenantId);
    if(!campaign)throw fault(404,'CAMPAIGN_NOT_FOUND','Campaign not found.');
    const existing=(current.campaignAssets||[]).find(a=>a.tenantId===tenantId&&a.sha256===hash);
    if(existing){await this.#attach(tenantId,campaignId,existing.id);return{asset:publicAsset(existing),duplicate:true};}
    const id=this.idFactory();
    const relativePath=join(tenantId,`${id}.${detected.ext}`);
    const fullPath=resolve(this.rootDir,relativePath);
    if(!fullPath.startsWith(`${this.rootDir}/`))throw fault(400,'INVALID_PATH','Invalid asset path.');
    await mkdir(join(this.rootDir,tenantId),{recursive:true,mode:0o700});
    const displayName=String(fileName||`creative.${detected.ext}`).replace(/[\r\n\0]/g,'').split(/[\\/]/).pop().slice(0,120)||`creative.${detected.ext}`;
    const now=new Date(this.clock()).toISOString();
    const record={id,tenantId,campaignId,fileName:displayName,contentType:detected.type,bytes:bytes.length,sha256:hash,relativePath,createdAt:now};
    await writeFile(fullPath,bytes,{flag:'wx',mode:0o600});
    try{
      await this.store.update(state=>{
        state.campaignAssets||=[];state.auditEvents||=[];
        const owned=(state.campaigns||[]).find(c=>c.id===campaignId&&c.tenantId===tenantId);
        if(!owned)throw fault(404,'CAMPAIGN_NOT_FOUND','Campaign not found.');
        state.campaignAssets.push(record);
        owned.assets||={};owned.assets.creativeAssetIds||=[];
        if(!owned.assets.creativeAssetIds.includes(id))owned.assets.creativeAssetIds.push(id);
        owned.updatedAt=now;
        if(owned.reviewStatus==='approved'){owned.reviewStatus='needs_review';owned.approval=null;}
        state.auditEvents.push({id:this.idFactory(),tenantId,actorId:user.id||null,type:'campaign.asset_uploaded',entityId:campaignId,createdAt:now});
      });
    }catch(e){await rm(fullPath,{force:true});throw e;}
    return{asset:publicAsset(record),duplicate:false};
  }
  async #attach(tenantId,campaignId,assetId){
    const now=new Date(this.clock()).toISOString();
    await this.store.update(state=>{
      state.auditEvents||=[];
      const c=(state.campaigns||[]).find(x=>x.id===campaignId&&x.tenantId===tenantId);
      if(!c)throw fault(404,'CAMPAIGN_NOT_FOUND','Campaign not found.');
      c.assets||={};c.assets.creativeAssetIds||=[];
      if(!c.assets.creativeAssetIds.includes(assetId))c.assets.creativeAssetIds.push(assetId);
      c.updatedAt=now;
      if(c.reviewStatus==='approved'){c.reviewStatus='needs_review';c.approval=null;}
      state.auditEvents.push({id:this.idFactory(),tenantId,type:'campaign.asset_attached',entityId:campaignId,createdAt:now});
    });
  }
  async listForCampaign({user,campaignId}){
    const tenantId=user?.tenantId;if(!safeId(tenantId)||!safeId(campaignId))throw fault(400,'INVALID_SCOPE','Invalid tenant or campaign.');
    const state=await this.store.read();
    const c=(state.campaigns||[]).find(x=>x.id===campaignId&&x.tenantId===tenantId);
    if(!c)throw fault(404,'CAMPAIGN_NOT_FOUND','Campaign not found.');
    const ids=new Set(c.assets?.creativeAssetIds||[]);
    return(state.campaignAssets||[]).filter(a=>a.tenantId===tenantId&&ids.has(a.id)).map(publicAsset);
  }
  async get({user,assetId}){
    const tenantId=user?.tenantId;if(!safeId(tenantId)||!safeId(assetId))throw fault(404,'ASSET_NOT_FOUND','Asset not found.');
    const state=await this.store.read();const a=(state.campaignAssets||[]).find(x=>x.id===assetId&&x.tenantId===tenantId);
    if(!a)throw fault(404,'ASSET_NOT_FOUND','Asset not found.');
    const path=resolve(this.rootDir,a.relativePath);
    if(!path.startsWith(`${this.rootDir}/`))throw fault(404,'ASSET_NOT_FOUND','Asset not found.');
    try{return{asset:publicAsset(a),buffer:await readFile(path)};}catch{throw fault(404,'ASSET_NOT_FOUND','Asset file not found.');}
  }
  async remove({user,assetId}){
    const tenantId=user?.tenantId;if(!safeId(tenantId)||!safeId(assetId))throw fault(404,'ASSET_NOT_FOUND','Asset not found.');
    let path;
    await this.store.update(state=>{
      const a=(state.campaignAssets||[]).find(x=>x.id===assetId&&x.tenantId===tenantId);
      if(!a)throw fault(404,'ASSET_NOT_FOUND','Asset not found.');
      const refs=(state.campaigns||[]).filter(c=>c.tenantId===tenantId&&(c.assets?.creativeAssetIds||[]).includes(assetId));
      if(refs.some(c=>c.reviewStatus==='approved'||c.status==='external_linked'))throw fault(409,'ASSET_IN_USE','Detach or re-review the creative before deleting it.');
      for(const c of refs)c.assets.creativeAssetIds=c.assets.creativeAssetIds.filter(id=>id!==assetId);
      state.campaignAssets=state.campaignAssets.filter(x=>x.id!==assetId);
      path=resolve(this.rootDir,a.relativePath);
    });
    if(path&&path.startsWith(`${this.rootDir}/`))await rm(path,{force:true});
    return{deleted:true};
  }
}
