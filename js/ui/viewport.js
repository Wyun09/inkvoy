const editable=node=>node?.matches?.('textarea,input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),[contenteditable="true"]');

// All UI surfaces share the same visual viewport. CSS zoom is applied exactly once.
export function installViewport(){
 if(window.StudioViewport)return window.StudioViewport;
 const root=document.documentElement,baselines=new Map();let frame=0,last='',snapshot;
 function measure(){
  frame=0;const v=window.visualViewport,scale=Number(getComputedStyle(root).getPropertyValue('--ui-scale'))||.9;
  const width=Math.round(Math.min(innerWidth,v?.width||innerWidth)),height=Math.round(Math.min(innerHeight,v?.height||innerHeight)),key=Math.round(width/20)*20;
  const previous=baselines.get(key)||height,baseline=Math.max(previous,height);baselines.set(key,baseline);
  const keyboard=!!editable(document.activeElement)&&baseline-height>Math.max(140,baseline*.22);
  const layout=width>=1000?'wide':width>=600&&width>baseline*1.15&&height<=560?'landscape':'phone';
  const editTarget=document.activeElement?.closest('#page-computer')?'browser':document.activeElement?.closest('.model-dialog,.journey-dialog')?'dialog':'chat';
  const top=Math.max(0,v?.offsetTop||0),left=Math.max(0,v?.offsetLeft||0),stamp=[width,height,scale,keyboard,layout,top,left,editTarget].join('|');
  if(stamp===last)return;last=stamp;snapshot=Object.freeze({width,height,scale,keyboard,layout,top,left});
  root.style.setProperty('--viewport-width',width+'px');root.style.setProperty('--viewport-height',height+'px');root.style.setProperty('--viewport-top',top+'px');root.style.setProperty('--viewport-left',left+'px');
  document.body.dataset.keyboard=String(keyboard);document.body.dataset.layout=layout;
  document.body.dataset.editTarget=editTarget;
  window.dispatchEvent(new CustomEvent('studio:viewport',{detail:snapshot}));
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(measure);}
 const observer=new MutationObserver(schedule);observer.observe(root,{attributes:true,attributeFilter:['style']});
 for(const name of ['resize','orientationchange'])window.addEventListener(name,schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
 document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);
 window.StudioViewport={refresh:schedule,snapshot:()=>snapshot};measure();return window.StudioViewport;
}
