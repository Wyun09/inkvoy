// Evaluated only in the DeepSeek model page; historical message images are excluded.
export function composerUploadState({names=[],selector,mark}={}){
 const visible=e=>{if(!e?.isConnected||!e.getClientRects().length)return false;for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}return true;};
 const composers=[...document.querySelectorAll(selector||'textarea')].filter(visible);if(composers.length!==1)return {scopeVerified:false,count:0,readyCount:0,pendingCount:0,names:[],reason:'composer_missing'};
 const composer=composers[0],history='.ds-message,[data-role="assistant"],[data-role="user"],.ds-markdown';
 let root=composer.parentElement;
 for(let n=root,depth=0;n&&n!==document.body&&depth<7;n=n.parentElement,depth++){
  if(n.querySelector(history))break;
  if(n.matches('form')||n.querySelector('input[type="file"]')){root=n;if(n.matches('form')||n.querySelector('img,[data-attachment],[data-testid="attachment"]'))break;}
 }
 if(root===document.body||root?.querySelector(history))return {scopeVerified:false,count:0,readyCount:0,pendingCount:0,names:[],reason:'composer_scope_ambiguous'};
 if(mark){
  const candidates=[...document.querySelectorAll('input[type="file"]')].filter(e=>!e.disabled).map(e=>({e,score:(root.contains(e)?100:0)+(/image/i.test(e.accept)?20:0)-(/pdf|audio|video/i.test(e.accept)&&!/image/i.test(e.accept)?30:0)})).sort((a,b)=>b.score-a.score);
  if(!candidates.length||candidates.length>1&&candidates[0].score===candidates[1].score)return {scopeVerified:true,error:'网页图片上传入口不唯一，请检查网页的附件控件'};
  const input=candidates[0].e;input.setAttribute('data-dsh-upload',mark);return {scopeVerified:true,inputSelector:'input[data-dsh-upload="'+mark+'"]'};
 }
 const known='[data-testid="attachment"],[data-testid="file-preview"],[data-attachment],.ds-file-list-item,.ds-file-upload-item,.ds-attachment,.d5fa3d1b._183e647';
 const candidates=[...root.querySelectorAll(known)];
 for(const image of root.querySelectorAll('img')){
  if(!visible(image)||image.closest(history))continue;
  const src=image.currentSrc||image.src||'';if(!src.startsWith('blob:')&&!src.startsWith('data:image/')&&!names.includes(image.alt)&&!image.closest(known))continue;
  if(candidates.some(e=>e.contains(image)))continue;
  let card=image;for(let n=image.parentElement,depth=0;n&&n!==root&&depth<3;n=n.parentElement,depth++){if(n.contains(composer)||n.querySelectorAll('img').length!==1)break;card=n;if(n.matches('button,[role="button"]')||n.querySelector('button,[role="button"],progress,[role="progressbar"]'))break;}candidates.push(card);
 }
 const items=[...new Set(candidates)].filter(visible).filter(e=>!candidates.some(parent=>parent!==e&&parent.contains(e)));
 let readyCount=0,pendingCount=0,anonymousCount=0,failed=false;const identities=[];
 for(const item of items){
  const walker=document.createTreeWalker(item,NodeFilter.SHOW_TEXT),parts=[];let node;while((node=walker.nextNode()))if(visible(node.parentElement))parts.push(node.textContent);const text=parts.join(' '),status=[item.dataset.state,item.dataset.status].filter(Boolean).join(' ');
  const pending=/pending|uploading|processing|loading/i.test(status)||item.getAttribute('aria-busy')==='true'||[...item.querySelectorAll('[role="progressbar"],progress,[aria-busy="true"],[class*="loading" i],[class*="uploading" i],[data-icon="spin"]')].some(visible)||/(?:^|\s)\d{1,3}%(?:\s|$)|上传中|解析中|正在上传|processing|uploading/i.test(text);
  failed||=/error|fail/i.test(status)||/上传失败|解析失败|upload failed|failed to upload/i.test(text);if(pending)pendingCount++;
  const thumbs=[...item.querySelectorAll('img')].filter(visible);if(item.tagName==='IMG')thumbs.push(item);
  if(!pending&&(thumbs.length&&thumbs.every(i=>i.complete&&i.naturalWidth>0)||/^(ready|uploaded|complete|completed|success)$/i.test(status.trim())))readyCount++;
  const descriptions=[text,...[...item.querySelectorAll('[alt],[title],[data-file-name]'),item].flatMap(e=>[e.getAttribute('alt'),e.getAttribute('title'),e.getAttribute('data-file-name')])].filter(Boolean);
  const matched=names.filter(name=>descriptions.some(s=>s===name||s.includes(name)));if(matched.length===1)identities.push(matched[0]);else anonymousCount++;
 }
 failed||=[...document.querySelectorAll('[role="alert"],.ds-toast')].filter(visible).some(e=>/上传失败|解析失败|upload failed|failed to upload/i.test(e.innerText||''));
 return {scopeVerified:true,count:items.length,readyCount,pendingCount,failed,names:identities,anonymousCount};
}
