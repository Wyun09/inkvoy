const streams=new WeakMap();
const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;

// Received content is present immediately; only new chunks fade in. Consolidate
// finished chunks so long responses do not accumulate DOM nodes or timers.
export function revealStream(node,value){
 const source=String(value||'');let state=streams.get(node);
 if(!state||!source.startsWith(state.source)){state={source:'',prefix:document.createTextNode(''),pending:[]};node.replaceChildren(state.prefix);streams.set(node,state);}
 const added=source.slice(state.source.length);state.source=source;if(!added)return;
 const flush=()=>{if(streams.get(node)!==state)return;while(state.pending[0]?.done){const entry=state.pending.shift();state.prefix.appendData(entry.node.textContent);entry.node.remove();}};
 if(reduced()||document.body.hasAttribute('data-ui-paused')||added.length>12000){for(const entry of state.pending)entry.done=true;flush();state.prefix.appendData(added);return;}
 const span=document.createElement('span');span.className='stream-arrival';span.textContent=added;const entry={node:span,done:false};state.pending.push(entry);node.append(span);
 const settle=()=>{entry.done=true;flush();};span.addEventListener('animationend',settle,{once:true});span.addEventListener('animationcancel',settle,{once:true});
 while(state.pending.length>6){state.pending[0].done=true;flush();}
}
export function finishStream(node){streams.delete(node);}

export function smoothThoughtDisclosure(details,body){
 const summary=details.querySelector('summary');let motion=null,closing=false;
 summary.addEventListener('click',event=>{
  event.preventDefault();details.dataset.manual='true';const close=details.open&&!closing;
  if(reduced()||!body.animate){motion?.cancel();motion=null;closing=false;details.open=!close;body.style.removeProperty('overflow');return;}
  const current=details.open?body.getBoundingClientRect().height:0;motion?.cancel();details.open=true;closing=close;body.style.overflow='hidden';
  const target=close?0:Math.min(body.scrollHeight,280);
  motion=body.animate([{height:current+'px',opacity:close?1:.25},{height:target+'px',opacity:close?0:1}],{duration:280,easing:'cubic-bezier(.22,.8,.25,1)'});
  const active=motion;void active.finished.then(()=>{if(motion!==active)return;motion=null;if(close)details.open=false;closing=false;body.style.removeProperty('overflow');}).catch(()=>{});
 });
}
