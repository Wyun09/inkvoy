import {uiIcon} from '../icon-system.js';

export const DESTINATIONS=[
 ['chat','对话','chat','chat conversation','工作区'],['files','项目文件','files','files explorer code','工作区'],['terminal','终端','terminal','terminal shell debian bash','工作区'],['computer','AI 浏览器','browser','browser computer web','工作区'],['home','工作台','home','dashboard overview','工作区'],
 ['models','模型与 API','connect','model api endpoint provider','连接'],['accounts','账号与模型','account','account chatgpt login','连接'],['extensions','扩展与技能','extensions','mcp plugins skills extension','连接'],['tools','工具与环境','settings','tools runtime','工具'],['web','DeepSeek 网页','browser','deepseek login webpage','连接'],['connect','外接客户端','connect','client bridge api','连接'],['tasks','任务记录','home','tasks history','工具'],['settings','外观与显示','appearance','settings appearance scale theme','偏好']
];

export function createCommandPalette({client,navigate,selectSession,motion,notify}){
 const overlay=document.createElement('div');overlay.className='command-scrim workspace-overlay';overlay.id='command-palette';overlay.hidden=true;
 overlay.innerHTML='<section class="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-label"><header><span id="command-label">快速前往</span><button type="button" id="command-close" aria-label="关闭快捷面板">Esc</button></header><div class="command-input-row"><span class="command-search-icon"></span><input id="command-input" type="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="搜索页面、对话或操作…" aria-label="搜索页面与对话" role="combobox" aria-expanded="true" aria-controls="command-results" aria-autocomplete="list"></div><div id="command-results" role="listbox" aria-label="快捷面板结果"></div><footer><span><kbd>↑</kbd><kbd>↓</kbd> 选择 <kbd>↵</kbd> 打开</span><span>IN K V O Y</span></footer></section>';
 document.getElementById('app').append(overlay);overlay.querySelector('.command-search-icon').append(uiIcon('search'));
 const input=overlay.querySelector('input'),results=overlay.querySelector('#command-results');let items=[],index=0,focus,disabled=[];
 const inertTargets=()=>document.querySelectorAll('#workspace-content,.topbar,.bottom-nav,#workspace-rail,#workspace-view-tabs,.workspace-statusbar');
 function close(){if(overlay.hidden)return false;overlay.hidden=true;motion.stop(overlay.firstElementChild);for(const [node,value]of disabled)node.inert=value;disabled=[];input.value='';focus?.isConnected&&focus.focus();window.BridgeDashboard?.layout();return true;}
 async function choose(item){if(!item||item.disabled)return;close();try{await item.run();}catch(error){notify(error.message||'无法打开此项目');}}
 function highlight(){const buttons=results.querySelectorAll('[role=option]');buttons.forEach((button,i)=>button.setAttribute('aria-selected',String(i===index)));const current=buttons[index];if(current){input.setAttribute('aria-activedescendant',current.id);current.scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');}
 function render(){
  const query=input.value.trim().toLocaleLowerCase(),state=client.snapshot();
  const routes=DESTINATIONS.map(([route,title,icon,keywords,group])=>({title,icon,group,detail:route==='models'?'连接设置':group,search:title+' '+keywords,run:()=>navigate(route)}));
  const sessions=state.sessions.filter(s=>!s.archived).sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,12).map(s=>({title:s.title,icon:'chat',group:'本机对话',detail:s.id===state.selected?'当前对话':'打开对话',search:s.title,run:()=>selectSession(s.id)}));
  const actions=[{title:'使用帮助',icon:'settings',group:'操作',detail:'本机服务与操作说明',search:'help 帮助 使用说明',run:()=>document.querySelector('[data-action=help]').click()},{title:'新建对话',icon:'new',group:'操作',detail:'新的项目与对话',search:'new 新建对话 项目',disabled:!!state.active,run:()=>document.getElementById('chat-new').click()},{title:'切换明暗主题',icon:'appearance',group:'操作',detail:'外观',search:'theme 主题 dark light',run:()=>document.getElementById('theme').click()}];
  items=[...routes,...sessions,...actions].filter(item=>!query||(item.title+' '+item.search).toLocaleLowerCase().includes(query));index=0;results.replaceChildren();let previous='';
  for(const [i,item]of items.entries()){
   if(item.group!==previous){const heading=document.createElement('p');heading.className='command-group';heading.textContent=item.group;results.append(heading);previous=item.group;}
   const button=document.createElement('button');button.type='button';button.id='command-result-'+i;button.role='option';button.tabIndex=-1;button.disabled=!!item.disabled;button.append(uiIcon(item.icon));const label=document.createElement('span');label.textContent=item.title;const detail=document.createElement('small');detail.textContent=item.detail;button.append(label,detail);button.onclick=()=>void choose(item);button.onpointermove=()=>{index=i;highlight();};results.append(button);
  }
  if(!items.length){const empty=document.createElement('div');empty.className='command-empty';empty.append(uiIcon('search'));const p=document.createElement('p');p.textContent='没有匹配的页面或对话';empty.append(p);results.append(empty);}
  highlight();
 }
 function open(){
  if(!overlay.hidden){input.focus();return;}
  if(document.querySelector('.model-scrim:not([hidden]),.media-viewer:not([hidden]),#studio-drawer-scrim:not([hidden])'))return;
  focus=document.activeElement;disabled=[...inertTargets()].map(node=>[node,node.inert]);for(const [node]of disabled)node.inert=true;overlay.hidden=false;render();input.focus();motion.run(overlay.firstElementChild,{opacity:[0,1],transform:['translateY(-8px) scale(.985)','translateY(0) scale(1)']});window.BridgeDashboard?.layout();
 }
 input.oninput=render;overlay.querySelector('#command-close').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close();};
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(items.length){const direction=e.key==='ArrowDown'?1:-1;for(let n=0;n<items.length;n++){index=(index+direction+items.length)%items.length;if(!items[index].disabled)break;}highlight();}}else if(e.key==='Enter'){e.preventDefault();void choose(items[index]);}else if(e.key==='Tab'){e.preventDefault();input.focus();}});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();overlay.hidden?open():close();}});
 return {open,close,render,get isOpen(){return !overlay.hidden;}};
}
