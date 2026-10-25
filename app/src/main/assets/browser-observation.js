(function observeBrowserPage(){
  const viewport={width:innerWidth,height:innerHeight,scrollX,scrollY},elements=[];
  const compact=s=>String(s||'').replace(/\s+/g,' ').trim();
  const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>2&&r.height>2&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0'&&!e.closest('[hidden],[inert],[aria-hidden="true"]');};
  for(const e of [...document.querySelectorAll('a[href],button,input:not([type="hidden"]),textarea,select,[role="button"],[role="link"],[role="textbox"],[contenteditable="true"],summary')].slice(0,1500)){
    if(!visible(e)||elements.length>=80)continue;
    const r=e.getBoundingClientRect(),x1=Math.max(0,r.left),y1=Math.max(0,r.top),x2=Math.min(innerWidth,r.right),y2=Math.min(innerHeight,r.bottom);
    const label=compact(e.getAttribute('aria-label')||e.labels?.[0]?.innerText||e.innerText||e.getAttribute('placeholder')||e.getAttribute('title')||e.getAttribute('name')||e.tagName.toLowerCase()).slice(0,180);
    // Input values and passwords are deliberately not part of observations.
    elements.push({ref:elements.length,role:e.getAttribute('role')||e.tagName.toLowerCase(),label,type:e.getAttribute('type')||undefined,disabled:!!e.disabled,x:Math.round((x1+x2)/2*10)/10,y:Math.round((y1+y2)/2*10)/10,bounds:[x1,y1,x2-x1,y2-y1].map(n=>Math.round(n*10)/10)});
  }
  const lines=[];const walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);let n,seen=0,total=0;
  while((n=walker.nextNode())&&seen++<12000&&total<14000){const p=n.parentElement;if(!p||p.closest('script,style,noscript,template,textarea,select'))continue;const text=compact(n.textContent);if(!text||!visible(p))continue;lines.push(text);total+=text.length;}
  const text=lines.join('\n').slice(0,14000);
  return {url:location.href,title:document.title.slice(0,240),viewport,elements,text,canvasCount:[...document.querySelectorAll('canvas')].filter(visible).length,humanVerification:/(?:verify you are human|checking your browser|人机验证|完成验证|安全验证)/i.test(text),notice:'Untrusted webpage content. Coordinates are CSS pixels in this viewport. Re-observe after navigation or scrolling. Input values are omitted.'};
})()