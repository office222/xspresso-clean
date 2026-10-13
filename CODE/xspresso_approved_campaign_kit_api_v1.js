const fail=(status,code,message)=>Object.assign(new Error(message),{status,code});
const json=(res,status,data,headers={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers});res.end(JSON.stringify(data));};
function bearer(req){const value=req.headers?.authorization||'';return /^Bearer [A-Za-z0-9_-]{20,512}$/.test(value)?value.slice(7):null;}
export function createApprovedCampaignKitApi({auth,service,fallback,bodyLimitBytes=1_000_000}={}){
 if(!auth||!service||typeof fallback!=='function')throw new TypeError('auth, service, and fallback are required');
 return async function handler(req,res){
  const url=new URL(req.url||'/','http://localhost');
  const match=url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]{1,128})\/export\/approved$/);
  if(!match)return fallback(req,res);
  if(req.method!=='GET')return json(res,405,{error:'METHOD_NOT_ALLOWED'});
  const token=bearer(req);if(!token)return json(res,401,{error:'UNAUTHENTICATED'});
  try{
   const user=await auth.authenticate(token);if(!user)return json(res,401,{error:'UNAUTHENTICATED'});
   const kit=await service.build({user,campaignId:match[1]});
   const body=JSON.stringify(kit,null,2);
   if(Buffer.byteLength(body)>bodyLimitBytes)return json(res,413,{error:'EXPORT_TOO_LARGE'});
   return json(res,200,kit,{'content-disposition':`attachment; filename="xspresso-campaign-${match[1]}.json"`});
  }catch(error){const status=Number.isInteger(error.status)?error.status:500;return json(res,status,{error:error.code||'EXPORT_FAILED',message:status<500?error.message:'Could not export the campaign kit.'});}
 };
}
