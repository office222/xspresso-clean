const fault=(status,code,message)=>Object.assign(new Error(message),{status,code});
const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(value));};
async function readJson(req,limit=20_000){const parts=[];let bytes=0;for await(const p of req){bytes+=p.length;if(bytes>limit)throw fault(413,'BODY_TOO_LARGE','Request is too large.');parts.push(p);}if(!bytes)return{};try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw fault(400,'INVALID_JSON','Request body must be valid JSON.');}}
const bearer=req=>/^Bearer\s+([A-Za-z0-9_-]{20,})$/i.exec(req.headers?.authorization||'')?.[1]||null;
export function createCampaignImageApiHandler({auth,imageService,fallback,bodyLimitBytes=20_000}={}){
 if(!auth||!imageService)throw new TypeError('auth and imageService are required');
 return async function handler(req,res){
  const url=new URL(req.url||'/','http://localhost');
  const match=url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]{1,128})\/images\/generate$/);
  if(!match)return fallback?.(req,res);
  if(req.method!=='POST')return json(res,405,{error:'METHOD_NOT_ALLOWED',message:'Use POST.'});
  const token=bearer(req);const user=token?await auth.authenticate(token):null;
  if(!user)return json(res,401,{error:'UNAUTHORIZED',message:'Sign in required.'});
  try{
   const body=await readJson(req,bodyLimitBytes);const key=req.headers?.['idempotency-key'];
   const result=await imageService.generate({user,campaignId:match[1],prompt:body.prompt,idempotencyKey:key,size:body.size,quality:body.quality,background:body.background,outputFormat:body.outputFormat});
   return json(res,result.replayed?200:201,result);
  }catch(e){const status=Number.isInteger(e.status)?e.status:500;return json(res,status,{error:e.code||'IMAGE_GENERATION_FAILED',message:status>=500?'Image generation failed.':e.message});}
 };
}
