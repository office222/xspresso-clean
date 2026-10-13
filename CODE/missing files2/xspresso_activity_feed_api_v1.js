export function createActivityFeedApiHandler({auth,service,fallback}={}){
 if(!auth||!service||typeof fallback!=='function')throw new TypeError('auth, service, and fallback are required.');
 return async function handle(req,res){const url=new URL(req.url||'/','http://localhost');const method=String(req.method||'GET').toUpperCase();const isList=url.pathname==='/api/activity'&&method==='GET';const isRead=url.pathname==='/api/activity/read'&&method==='POST';if(!isList&&!isRead)return fallback(req,res);
  try{const token=/^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(req.headers?.authorization||'')?.[1]||'';const user=await auth.authenticate(token);if(!user?.id||!user?.tenantId)return send(res,401,{error:'UNAUTHORIZED',message:'Sign in to continue.'});
   if(isRead)return send(res,200,await service.markRead({user}));const n=Number(url.searchParams.get('limit')||50);const before=url.searchParams.get('before')||undefined;return send(res,200,await service.list({user,limit:n,before}));
  }catch(e){const status=Number.isInteger(e?.status)?e.status:500;return send(res,status,{error:e?.code||'INTERNAL_ERROR',message:status>=500?'Activity could not be loaded.':e.message});}
 };
}
function send(res,status,value){const b=JSON.stringify(value);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(b),'cache-control':'no-store'});res.end(b);}
