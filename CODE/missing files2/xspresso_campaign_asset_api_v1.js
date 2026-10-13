const json=(res,status,payload,headers={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(payload));};
const fault=(status,code,message)=>Object.assign(new Error(message),{status,code});
async function readBuffer(req,limit){const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>limit)throw fault(413,'BODY_TOO_LARGE','Image exceeds the upload limit.');chunks.push(c);}return Buffer.concat(chunks);}
function bearer(req){const h=req.headers?.authorization||'';return /^Bearer\s+([A-Za-z0-9_-]{20,})$/i.exec(h)?.[1]||null;}
export function createCampaignAssetApiHandler({auth,assetService,fallback,bodyLimitBytes=12*1024*1024}={}){
  if(!auth||!assetService)throw new TypeError('auth and assetService are required');
  return async function handler(req,res){
    const url=new URL(req.url||'/','http://localhost');
    let m=url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]{1,128})\/assets$/);
    if(!m){m=url.pathname.match(/^\/api\/assets\/([A-Za-z0-9_-]{1,128})$/);if(!m)return fallback?.(req,res);}
    const token=bearer(req);const user=token?await auth.authenticate(token):null;
    if(!user)return json(res,401,{error:'UNAUTHORIZED',message:'Sign in required.'});
    try{
      const campaignMatch=url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]{1,128})\/assets$/);
      if(campaignMatch&&req.method==='GET')return json(res,200,{assets:await assetService.listForCampaign({user,campaignId:campaignMatch[1]})});
      if(campaignMatch&&req.method==='POST'){
        const contentType=String(req.headers?.['content-type']||'').split(';')[0].trim().toLowerCase();
        const buffer=await readBuffer(req,bodyLimitBytes);
        let fileName=req.headers?.['x-asset-filename']||'';try{fileName=decodeURIComponent(fileName);}catch{throw fault(400,'INVALID_FILENAME','Invalid file name.');}
        const result=await assetService.upload({user,campaignId:campaignMatch[1],fileName,contentType,buffer});
        return json(res,result.duplicate?200:201,result);
      }
      const assetMatch=url.pathname.match(/^\/api\/assets\/([A-Za-z0-9_-]{1,128})$/);
      if(assetMatch&&req.method==='GET'){
        const {asset,buffer}=await assetService.get({user,assetId:assetMatch[1]});
        const ext=asset.contentType==='image/jpeg'?'jpg':asset.contentType.split('/')[1];
        res.writeHead(200,{'content-type':asset.contentType,'content-length':buffer.length,'content-disposition':`inline; filename="creative.${ext}"`,'x-content-type-options':'nosniff','cache-control':'private, no-store'});return res.end(buffer);
      }
      if(assetMatch&&req.method==='DELETE')return json(res,200,await assetService.remove({user,assetId:assetMatch[1]}));
      return json(res,405,{error:'METHOD_NOT_ALLOWED',message:'Method not allowed.'},{allow:campaignMatch?'GET, POST':'GET, DELETE'});
    }catch(e){const status=Number.isInteger(e.status)?e.status:500;return json(res,status,{error:e.code||'ASSET_ERROR',message:status>=500?'Asset operation failed.':e.message});}
  };
}
