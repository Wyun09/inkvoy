(async function browserPageAction(a){
 const store=window.__studioComputerV2;if(!store)throw new Error('先观察当前网页以建立控件定位');
 const editable=e=>!!e&&!e.disabled&&!e.readOnly&&(e.matches('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]),textarea')||e.isContentEditable);
 const label=e=>(e.getAttribute('aria-label')||e.labels?.[0]?.innerText||e.innerText||e.getAttribute('placeholder')||e.getAttribute('title')||e.getAttribute('name')||e.tagName.toLowerCase()).replace(/\s+/g,' ').trim().slice(0,180);
 let e=a.ref?store.refs.get(a.ref):null;
 if(!e&&a.target){const matches=[...store.refs.values()].filter(n=>n.isConnected&&label(n)===a.target&&getComputedStyle(n).display!=='none');if(matches.length!==1)throw new Error(matches.length?'目标名称不唯一，请使用 ref':'当前页面没有匹配的目标');e=matches[0];}
 if(!e&&!a.ref&&!a.target&&['type','clear','delete','key'].includes(a.action))e=editable(document.activeElement)?document.activeElement:null;
 if(!e||!e.isConnected)throw new Error('目标已离开当前文档，请观察新页面；未点击或修改其他控件');
 const s=getComputedStyle(e);if(e.disabled||e.closest('[hidden],[inert]')||s.display==='none'||s.visibility==='hidden')throw new Error('目标当前不可用');
 const ref=store.ids.get(e);if(a.documentId&&a.documentId!==store.documentId)throw new Error('当前网页已更换，拒绝使用旧页面目标');
 if(a.expectedLabel!==undefined&&a.expectedLabel!==label(e))throw new Error('目标含义已变化，请观察新目标；未执行操作');
 if(a.expectedHref!==undefined){let href='';try{const url=new URL(e.href);href=url.origin+url.pathname;}catch{}if(href!==a.expectedHref)throw new Error('目标链接已变化，未点击');}
 const editing=['type','clear','delete','key'].includes(a.action);
 if(editing&&!editable(e))throw new Error('目标不是可编辑输入框');
 let r=e.getBoundingClientRect(),v=visualViewport;
 if(r.top<(v?.offsetTop||0)||r.bottom>(v?.offsetTop||0)+(v?.height||innerHeight)||r.left<(v?.offsetLeft||0)||r.right>(v?.offsetLeft||0)+(v?.width||innerWidth)){
  e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 }
 if(editing){e.focus({preventScroll:true});if(document.activeElement!==e&&!e.contains(document.activeElement))throw new Error('页面未允许目标输入框获得焦点');store.lastEditable=ref;}
 if(a.phase==='prepare'||a.action==='click'){
  r=e.getBoundingClientRect();v=visualViewport;const left=Math.max(r.left,v?.offsetLeft||0),right=Math.min(r.right,(v?.offsetLeft||0)+(v?.width||innerWidth)),top=Math.max(r.top,v?.offsetTop||0),bottom=Math.min(r.bottom,(v?.offsetTop||0)+(v?.height||innerHeight));if(right<=left||bottom<=top)throw new Error('目标当前不在可见区域');const x=(left+right)/2,y=(top+bottom)/2,hit=document.elementFromPoint(x,y);
  if(hit!==e&&!e.contains(hit))throw new Error('目标被其他内容遮挡，请先关闭遮挡层');
  if(editable(e))store.lastEditable=ref;
  if(a.phase==='prepare')return {ref,documentId:store.documentId,x:x-(v?.offsetLeft||0),y:y-(v?.offsetTop||0),editable:editable(e),label:label(e)};
 }
 if(a.action==='click'){if(editable(e)){e.focus({preventScroll:true});store.lastEditable=ref;}const target=e.getAttribute('target');if(target==='_blank')e.setAttribute('target','_self');try{e.click();}finally{if(target==='_blank')e.setAttribute('target',target);}return {accepted:true,method:'semantic-click',ref};}
 if(a.action==='key'){
  const key=String(a.key||'').toUpperCase();
  if(key==='SELECTALL'||key==='CTRL+A'){if(e.isContentEditable){const range=document.createRange();range.selectNodeContents(e);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}else e.select();return {accepted:true,ref};}
  if(key==='BACKSPACE'||key==='DELETE'){a={...a,action:'delete',direction:key==='DELETE'?'forward':'backward'};}
  else throw new Error('此按键由原生键盘处理');
 }
 const input=e.matches('input,textarea'),value=input?e.value:e.textContent||'';
 let start=input?(e.selectionStart??value.length):value.length,end=input?(e.selectionEnd??start):start;
 if(!input){const selection=getSelection();if(selection?.rangeCount){const selected=selection.getRangeAt(0);if(e.contains(selected.startContainer)&&e.contains(selected.endContainer)){const before=document.createRange();before.selectNodeContents(e);before.setEnd(selected.startContainer,selected.startOffset);start=before.toString().length;end=start+selected.toString().length;}}}
 let text=String(a.text??''),next,caret;
 if(a.action==='type'){if(a.clear){start=0;end=value.length;}next=value.slice(0,start)+text+value.slice(end);caret=start+text.length;}
 else if(a.action==='clear'){next='';caret=0;}
 else if(a.action==='delete'){
  const count=a.count??1;if(!Number.isInteger(count)||count<1||count>1000)throw new Error('删除字符数应在 1–1000 之间');
  if(start===end){if(a.direction==='forward')end=start+Array.from(value.slice(start)).slice(0,count).join('').length;else start-=Array.from(value.slice(0,start)).slice(-count).join('').length;}
  next=value.slice(0,start)+value.slice(end);caret=start;
 }else throw new Error('未知文本操作');
 const inputType=a.action==='type'?'insertText':a.action==='clear'?'deleteContentBackward':a.direction==='forward'?'deleteContentForward':'deleteContentBackward';
 if(!e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,composed:true,inputType,data:a.action==='type'?text:null})))throw new Error('页面取消了文本操作，未强制改写');
 if(input){const prototype=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(e,next);try{e.setSelectionRange(caret,caret);}catch{}}
 else{const selection=getSelection(),range=document.createRange();range.selectNodeContents(e);selection.removeAllRanges();selection.addRange(range);if(!document.execCommand('insertText',false,next)){e.textContent=next;range.selectNodeContents(e);range.collapse(false);selection.removeAllRanges();selection.addRange(range);}}
 e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType,data:a.action==='type'?text:null}));e.dispatchEvent(new Event('change',{bubbles:true}));
 await new Promise(resolve=>requestAnimationFrame(resolve));
 const actual=input?e.value:e.textContent||'';
 if(actual!==next)throw new Error('页面未保留输入结果，未自动重复输入；请检查控件限制');
 return {accepted:true,verified:true,method:'dom-input',ref,empty:actual.length===0,...(e.type==='password'?{}:{characters:actual.length})};
})