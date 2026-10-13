import { createHash, randomUUID } from 'node:crypto';

const fault=(status,code,message)=>Object.assign(new Error(message),{status,code});
const FORMAT_TYPES={png:'image/png',webp:'image/webp',jpeg:'image/jpeg'};

export class OpenAIImageProvider {
  constructor({apiKey,model,fetchImpl=globalThis.fetch,timeoutMs=120000,maxResponseBytes=24*1024*1024}={}){
    if(!apiKey||!model)throw new TypeError('OpenAI image API key and model are required');
    if(typeof fetchImpl!=='function')throw new TypeError('fetch is required');
    this.apiKey=apiKey;this.model=model;this.fetch=fetchImpl;this.timeoutMs=timeoutMs;this.maxResponseBytes=maxResponseBytes;
  }
  async generate({prompt,size='1024x1024',quality='medium',background='opaque',outputFormat='png'}={}){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),this.timeoutMs);timer.unref?.();
    try{
      const response=await this.fetch('https://api.openai.com/v1/images/generations',{method:'POST',redirect:'error',signal:controller.signal,headers:{authorization:`Bearer ${this.apiKey}`,'content-type':'application/json'},body:JSON.stringify({model:this.model,prompt,n:1,size,quality,background,output_format:outputFormat})});
      const text=await response.text();if(Buffer.byteLength(text)>this.maxResponseBytes)throw fault(502,'IMAGE_RESPONSE_TOO_LARGE','Image provider response was too large.');
      let data;try{data=JSON.parse(text);}catch{throw fault(502,'IMAGE_PROVIDER_BAD_RESPONSE','Image provider returned an unreadable response.');}
      if(!response.ok)throw fault(response.status===429?503:502,response.status===429?'IMAGE_PROVIDER_RATE_LIMITED':'IMAGE_PROVIDER_ERROR',response.status===429?'Image generation is temporarily rate limited.':'Image generation failed.');
      const b64=data?.data?.[0]?.b64_json;if(typeof b64!=='string'||b64.length<32)throw fault(502,'IMAGE_PROVIDER_EMPTY','Image provider returned no image data.');
      const buffer=Buffer.from(b64,'base64');if(!buffer.length||buffer.length>this.maxResponseBytes)throw fault(502,'IMAGE_PROVIDER_BAD_IMAGE','Image provider returned invalid image data.');
      return{buffer,contentType:FORMAT_TYPES[outputFormat]||'image/png',format:outputFormat};
    }catch(e){if(e?.name==='AbortError')throw fault(504,'IMAGE_PROVIDER_TIMEOUT','Image generation timed out.');if(Number.isInteger(e?.status))throw e;throw fault(502,'IMAGE_PROVIDER_UNAVAILABLE','Image provider is unavailable.');}
    finally{clearTimeout(timer);}
  }
}

export function createOpenAIImageProviderFromEnv(env=process.env,options={}){
  const key=env.OPENAI_API_KEY||'';const model=env.OPENAI_IMAGE_MODEL||'';
  if(!key&&!model)return null;
  if(!key||!model)throw new Error('Set both OPENAI_API_KEY and OPENAI_IMAGE_MODEL to enable image generation.');
  const timeout=Number(env.XSPRESSO_IMAGE_TIMEOUT_MS||120000);
  if(!Number.isInteger(timeout)||timeout<1000||timeout>300000)throw new Error('XSPRESSO_IMAGE_TIMEOUT_MS must be 1000..300000.');
  return new OpenAIImageProvider({apiKey:key,model,timeoutMs:timeout,...options});
}

export class CampaignImageGenerationService {
  constructor({store,assetService,provider,credits=null,creditCost=0,clock=Date.now,idFactory=randomUUID,processingLeaseMs=5*60_000}={}){
    if(!store||!assetService)throw new TypeError('store and assetService are required');
    if(!Number.isSafeInteger(creditCost)||creditCost<0)throw new TypeError('creditCost must be a nonnegative integer');
    this.store=store;this.assetService=assetService;this.provider=provider;this.credits=credits;this.creditCost=creditCost;this.clock=clock;this.idFactory=idFactory;this.processingLeaseMs=processingLeaseMs;
  }
  async generate({user,campaignId,prompt,idempotencyKey,size='1024x1024',quality='medium',background='opaque',outputFormat='png'}={}){
    const tenantId=user?.tenantId;
    if(!tenantId||!campaignId)throw fault(400,'INVALID_SCOPE','A signed-in user and campaign are required.');
    const brief=String(prompt||'').trim();
    if(brief.length<8||brief.length>5000)throw fault(400,'PROMPT_LENGTH_INVALID','Image prompt must be 8–5000 characters.');
    if(typeof idempotencyKey!=='string'||idempotencyKey.length<8||idempotencyKey.length>160)throw fault(400,'IDEMPOTENCY_KEY_REQUIRED','An Idempotency-Key header is required.');
    const options={size,quality,background,outputFormat};
    if(!['auto','1024x1024','1024x1536','1536x1024'].includes(size))throw fault(400,'IMAGE_SIZE_INVALID','Unsupported image size.');
    if(!['auto','low','medium','high','xhigh','max'].includes(quality))throw fault(400,'IMAGE_QUALITY_INVALID','Unsupported image quality.');
    if(!['auto','opaque','transparent'].includes(background)||!['png','jpeg','webp'].includes(outputFormat))throw fault(400,'IMAGE_FORMAT_INVALID','Unsupported background or output format.');
    if(background==='transparent'&&!['png','webp'].includes(outputFormat))throw fault(400,'IMAGE_FORMAT_INVALID','Transparent backgrounds require PNG or WebP output.');
    if(!this.provider)throw fault(503,'IMAGE_PROVIDER_NOT_CONFIGURED','Image generation is not configured.');
    const current=await this.store.read();const campaign=(current.campaigns||[]).find(c=>c.id===campaignId&&c.tenantId===tenantId);
    if(!campaign)throw fault(404,'CAMPAIGN_NOT_FOUND','Campaign not found.');
    const promptHash=createHash('sha256').update(brief).digest('hex');const now=this.clock();const attemptId=this.idFactory();
    const claim=await this.store.update(state=>{
      state.imageGenerationRequests||=[];
      const prior=state.imageGenerationRequests.find(r=>r.tenantId===tenantId&&r.campaignId===campaignId&&r.idempotencyKey===idempotencyKey);
      if(prior&&prior.promptHash!==promptHash)throw fault(409,'IDEMPOTENCY_KEY_REUSED','This idempotency key was used for a different prompt.');
      if(prior?.status==='completed')return{replay:prior};
      if(prior?.status==='processing'&&now-Date.parse(prior.updatedAt)<this.processingLeaseMs)throw fault(409,'IMAGE_GENERATION_IN_PROGRESS','This image request is already running.');
      const row=prior||{id:this.idFactory(),tenantId,campaignId,idempotencyKey,promptHash,createdAt:new Date(now).toISOString()};
      row.status='processing';row.attemptId=attemptId;row.updatedAt=new Date(now).toISOString();
      if(!prior)state.imageGenerationRequests.push(row);
      return{requestId:row.id,attemptId};
    });
    if(claim.replay)return{asset:claim.replay.asset,replayed:true};
    let charged=false;
    const chargeKey=`image:${tenantId}:${campaignId}:${idempotencyKey}:${attemptId}`;
    try{
      if(this.creditCost>0){if(!this.credits)throw fault(503,'CREDITS_UNAVAILABLE','Credits are unavailable.');await this.credits.post({tenantId,actorId:user.id,kind:'debit',credits:this.creditCost,reason:'AI image generation',idempotencyKey:chargeKey,referenceId:claim.requestId});charged=true;}
      const generated=await this.provider.generate({prompt:brief,...options});
      const assetResult=await this.assetService.upload({user,campaignId,fileName:`ai-creative-${this.idFactory()}.${generated.format}`,contentType:generated.contentType,buffer:generated.buffer});
      const completedAt=new Date(this.clock()).toISOString();
      await this.store.update(state=>{
        const row=(state.imageGenerationRequests||[]).find(r=>r.id===claim.requestId&&r.attemptId===attemptId);
        if(!row)throw fault(409,'IMAGE_REQUEST_REPLACED','Image request was replaced by a newer attempt.');
        row.status='completed';row.asset=assetResult.asset;row.completedAt=completedAt;row.updatedAt=completedAt;
      });
      return{asset:assetResult.asset,replayed:false,creditsCharged:this.creditCost};
    }catch(e){
      if(charged){try{await this.credits.post({tenantId,actorId:user.id,kind:'refund',credits:this.creditCost,reason:'Failed AI image generation',idempotencyKey:`${chargeKey}:refund`,referenceId:claim.requestId});}catch{}}
      await this.store.update(state=>{const row=(state.imageGenerationRequests||[]).find(r=>r.id===claim.requestId&&r.attemptId===attemptId);if(row){row.status='failed';row.errorCode=e.code||'IMAGE_GENERATION_FAILED';row.updatedAt=new Date(this.clock()).toISOString();}});
      throw e;
    }
  }
}
