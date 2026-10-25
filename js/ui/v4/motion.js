import {animate} from 'motion/mini';
import {createExpressiveMotion} from './expressive-motion.js';

// Only compositor properties; no JavaScript animation loop or WebView movement.
export function createWorkspaceMotion(){
 const expressive=createExpressiveMotion();
 const active=new Map(),seen=new WeakSet();let paused=document.hidden;
 const reduce=()=>paused||document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function stop(node){const previous=active.get(node);if(previous){previous.cancel();active.delete(node);}}
 function run(node,frames,options={}){
  if(!node||reduce()||!node.getClientRects().length)return;
  stop(node);const controls=animate(node,frames,{duration:.23,ease:[.16,1,.3,1],...options});active.set(node,controls);
  Promise.resolve(controls).then(()=>{if(active.get(node)===controls)active.delete(node);},()=>{});return controls;
 }
 function enter(node,{native=false}={}){if(native)return run(node?.querySelector('header'),{opacity:[.3,1]});if(!node||reduce())return;run(node,{opacity:[.25,1]},{duration:.3});const children=[...node.querySelectorAll('.welcome-starters>button,.hub-card,.builtin-skill,.workspace-launchers>button')].filter(n=>n.getClientRects().length).slice(0,8);if(children.length)for(const [i,child]of children.entries())expressive.spring(child,{}, {from:{y:18+i*5,scaleX:.96,scaleY:.94,rotate:i%2?1:-1},stiffness:280-i*12,damping:20});else if(!node.closest('.computer-workspace'))expressive.spring(node,{}, {from:{y:14,scaleX:.985,scaleY:.985},stiffness:280,damping:24});}
 function newlyVisible(container){if(reduce()||!container?.getClientRects().length)return;const nodes=container.querySelectorAll('.reply-turn,.reply-step');for(const node of [...nodes].slice(-12))if(!seen.has(node)){seen.add(node);run(node,{opacity:[.2,1],transform:['translateY(5px)','translateY(0)']},{duration:.22});}}
 function settle(){for(const [node,controls] of active){try{controls.complete();}catch{controls.cancel();}active.delete(node);}}
 document.addEventListener('visibilitychange',()=>{paused=document.hidden;if(paused)settle();});
 new MutationObserver(()=>{if(reduce())settle();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(reduce())settle();});
 return {run,enter,newlyVisible,settle,stop,expressive,enabled:()=>!reduce(),get activeCount(){return active.size+expressive.activeCount;}};
}
