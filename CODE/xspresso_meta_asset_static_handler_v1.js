import {readFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=dirname(fileURLToPath(import.meta.url));
const ASSETS=new Map([
 ['/','xspresso_dashboard_meta_connection_v2.html'],['/xspresso_dashboard_meta_connection_v2.html','xspresso_dashboard_meta_connection_v2.html'],
 ['/xspresso_dashboard_v2.css','xspresso_dashboard_v2.css'],['/xspresso_dashboard_app_v3_1.js','xspresso_dashboard_app_v3_1.js'],
 ['/xspresso_dashboard_api_client_v3.js','xspresso_dashboard_api_client_v3.js'],['/xspresso_meta_connection_panel_v2.js','xspresso_meta_connection_panel_v2.js'],
 ['/xspresso_meta_connection_api_v2.js','xspresso_meta_connection_api_v2.js'],['/xspresso_meta_connection_panel_v1.css','xspresso_meta_connection_panel_v1.css'],
 ['/xspresso_asset_library_panel_v1.js','xspresso_asset_library_panel_v1.js']
]);
const TYPES={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const JSON=(res,status,x)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(x));};
export function createXspressoAssetStaticHandler({api,webRoot=ROOT}={}){if(!api)throw new TypeError('api handler required');const root=resolve(webRoot);return async function(req,res){const url=new URL(req.url||'/','http://localhost');if(url.pathname.startsWith('/api/'))return api(req,res);if(!['GET','HEAD'].includes(req.method))return JSON(res,405,{error:'METHOD_NOT_ALLOWED'});const name=ASSETS.get(url.pathname);if(!name)return JSON(res,404,{error:'NOT_FOUND'});const path=resolve(join(root,name));if(!path.startsWith(`${root}/`))return JSON(res,404,{error:'NOT_FOUND'});try{let body=await readFile(path);if(name==='xspresso_dashboard_meta_connection_v2.html'){const script='<script type="module" src="/xspresso_asset_library_panel_v1.js"></script>';body=Buffer.from(body.toString('utf8').replace('</body>',`${script}</body>`));}res.writeHead(200,{'content-type':TYPES[name.slice(name.lastIndexOf('.'))]||'application/octet-stream','content-length':body.length,'cache-control':name.endsWith('.html')?'no-store':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"});return res.end(req.method==='HEAD'?undefined:body);}catch{return JSON(res,500,{error:'ASSET_READ_FAILED'});}};}
