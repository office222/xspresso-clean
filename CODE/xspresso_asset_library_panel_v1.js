const TOKEN_KEY='xspresso_token';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function token(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return'';}}
async function api(path,options={}){const headers=new Headers(options.headers||{});const t=token();if(t)headers.set('authorization',`Bearer ${t}`);const r=await fetch(path,{...options,headers});const type=r.headers.get('content-type')||'';if(!r.ok){let m=`Request failed (${r.status})`;try{m=(await r.json()).message||m;}catch{}throw new Error(m);}return type.includes('application/json')?r.json():r.blob();}
function mount(){const root=document.getElementById('app');if(!root)return;const target=root.querySelector('main')||root;if(document.getElementById('xspresso-asset-panel'))return;
 const panel=el('section','panel asset-panel');panel.id='xspresso-asset-panel';
 const title=el('h2','', 'Campaign creative assets');panel.append(title,el('p','muted','Upload PNG, JPEG, or WebP artwork. Assets are private to your workspace and do not publish ads.'));
 const form=el('form','asset-upload-form');const campaign=el('input','field');campaign.placeholder='Campaign ID';campaign.required=true;campaign.autocomplete='off';
 const file=el('input','field');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.required=true;
 const upload=el('button','button','Upload to campaign');upload.type='submit';const refresh=el('button','button secondary','Load assets');refresh.type='button';
 const status=el('p','status','');const list=el('div','asset-list');form.append(campaign,file,upload,refresh);panel.append(form,status,list);target.prepend(panel);
 let objectUrls=[];function clearList(){for(const u of objectUrls)URL.revokeObjectURL(u);objectUrls=[];list.replaceChildren();}
 async function loadAssets(){clearList();try{const data=await api(`/api/campaigns/${encodeURIComponent(campaign.value.trim())}/assets`);for(const a of data.assets||[]){const card=el('article','asset-card');const img=el('img','asset-preview');img.alt=a.fileName||'Campaign creative';const blob=await api(`/api/assets/${encodeURIComponent(a.id)}`);const u=URL.createObjectURL(blob);objectUrls.push(u);img.src=u;const meta=el('div','asset-meta');meta.append(el('strong','',a.fileName||a.contentType),el('small','muted',`${Math.ceil(a.bytes/1024)} KB · ${a.contentType}`));card.append(img,meta);list.append(card);}}catch(e){status.textContent=e.message;}}
 form.addEventListener('submit',async event=>{event.preventDefault();const f=file.files?.[0];if(!f)return;upload.disabled=true;status.textContent='Uploading…';try{const bytes=await f.arrayBuffer();const result=await api(`/api/campaigns/${encodeURIComponent(campaign.value.trim())}/assets`,{method:'POST',headers:{'content-type':f.type,'x-asset-filename':encodeURIComponent(f.name)},body:bytes});status.textContent=result.duplicate?'Existing creative attached.':'Creative uploaded and attached.';file.value='';await loadAssets();}catch(e){status.textContent=e.message;}finally{upload.disabled=false;}});
 refresh.addEventListener('click',()=>void loadAssets());
 }
const observer=new MutationObserver(()=>mount());
function start(){mount();const root=document.getElementById('app');if(root)observer.observe(root,{subtree:true,childList:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
