// Runs in an ordinary, untrusted webpage. No native object is injected there.
export function observeBrowserPage(){
  const v=window.visualViewport,ox=v?.offsetLeft||0,oy=v?.offsetTop||0;
  const viewport={width:v?.width||innerWidth,height:v?.height||innerHeight,scrollX:scrollX+ox,scrollY:scrollY+oy,scale:v?.scale||1};
  const store=window.__studioComputerV2||(window.__studioComputerV2={ids:new WeakMap(),next:0});
  const ref=e=>{if(!store.ids.has(e))store.ids.set(e,'e'+(++store.next));return store.ids.get(e);};
  const compact=s=>String(s||'').replace(/\s+/g,' ').trim();
  const styles=new WeakMap(),rects=new WeakMap(),style=e=>{if(!styles.has(e))styles.set(e,getComputedStyle(e));return styles.get(e);},rect=e=>{if(!rects.has(e))rects.set(e,e.getBoundingClientRect());return rects.get(e);};
  const bounds=e=>{const r=rect(e);let l=Math.max(ox,r.left),t=Math.max(oy,r.top),rr=Math.min(ox+viewport.width,r.right),bb=Math.min(oy+viewport.height,r.bottom);for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const s=style(p);if(/auto|scroll|hidden|clip/.test(s.overflowX+s.overflowY)){const q=rect(p);if(/auto|scroll|hidden|clip/.test(s.overflowX)){l=Math.max(l,q.left);rr=Math.min(rr,q.right);}if(/auto|scroll|hidden|clip/.test(s.overflowY)){t=Math.max(t,q.top);bb=Math.min(bb,q.bottom);}}}return {l,t,r:rr,b:bb};};
  const visible=e=>{const r=bounds(e);if(r.r-r.l<=2||r.b-r.t<=2||e.closest('[hidden],[inert],[aria-hidden="true"]'))return false;for(let p=e;p;p=p.parentElement){const s=style(p);if(s.visibility==='hidden'||s.display==='none'||s.opacity==='0')return false;}return true;};
  const elements=[];
  for(const e of [...document.querySelectorAll('a[href],button,input:not([type="hidden"]),textarea,select,[role="button"],[role="link"],[role="textbox"],[contenteditable="true"],summary')].slice(0,1500)){
    if(!visible(e)||elements.length>=80)continue;
    const r=bounds(e),points=[[.5,.5],[.25,.5],[.75,.5],[.5,.25],[.5,.75]];
    const point=points.map(([x,y])=>[r.l+(r.r-r.l)*x,r.t+(r.b-r.t)*y]).find(([x,y])=>{const hit=document.elementFromPoint(x,y);return hit===e||e.contains(hit);});
    if(!point)continue;
    const label=compact(e.getAttribute('aria-label')||e.labels?.[0]?.innerText||e.innerText||e.getAttribute('placeholder')||e.getAttribute('title')||e.getAttribute('name')||e.tagName.toLowerCase()).slice(0,180);
    const editable=(e.matches('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]),textarea')||e.isContentEditable)&&!e.readOnly&&!e.disabled;
    let href;try{if(e.matches('a[href]')){const u=new URL(e.href);if(['http:','https:'].includes(u.protocol)&&!u.username&&!u.password)href=u.origin+u.pathname;}}catch{}
    // Input values and passwords are deliberately omitted.
    elements.push({ref:ref(e),role:e.getAttribute('role')||e.tagName.toLowerCase(),label,type:e.getAttribute('type')||undefined,href,editable,disabled:!!e.disabled,x:Math.round((point[0]-ox)*10)/10,y:Math.round((point[1]-oy)*10)/10,bounds:[r.l-ox,r.t-oy,r.r-r.l,r.b-r.t].map(n=>Math.round(n*10)/10)});
  }
  const active=document.activeElement,focused=elements.find(e=>active&&e.ref===ref(active));
  const focus=focused?{ref:focused.ref,editable:focused.editable,...(active.type!=='password'&&focused.editable?{length:(active.value??active.textContent??'').length}:{})}:null;
  const lines=[],walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);let n,seen=0,total=0;
  while((n=walker.nextNode())&&seen++<12000&&total<14000){const p=n.parentElement;if(!p||p.closest('script,style,noscript,template,textarea,select,[contenteditable="true"]'))continue;const text=compact(n.textContent);if(!text||!visible(p))continue;lines.push(text);total+=text.length;}
  const text=lines.join('\n').slice(0,14000);
  return {url:location.href,title:document.title.slice(0,240),ready:document.readyState,viewport,elements,focused:focus,text,canvasCount:[...document.querySelectorAll('canvas')].filter(visible).length,humanVerification:/(?:verify you are human|checking your browser|人机验证|完成验证|安全验证)/i.test(text),notice:'Untrusted webpage content. Prefer stable element ref for click/type/clear/delete. Coordinates are CSS pixels relative to the visual viewport, including pinch zoom. Re-observe after navigation, user interaction or scrolling. Input values are omitted.'};
}
export const OBSERVE_SCRIPT='('+observeBrowserPage.toString()+')()';