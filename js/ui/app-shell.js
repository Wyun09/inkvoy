import {uiIcon} from './icon-system.js';
const routes={chat:'对话',files:'项目文件',terminal:'终端',computer:'浏览器',home:'工作台',tasks:'任务记录',tools:'工具与环境',web:'DeepSeek 网页',connect:'外接客户端',accounts:'ChatGPT 账号',extensions:'扩展与技能',settings:'外观与显示'};
const node=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};

// Presentation owns its nodes; business controls keep their original event handlers.
export function createAppShell({client,providers,closeOverlays}){
 const $=id=>document.getElementById(id),app=$('app'),topbar=document.querySelector('.topbar'),brand=topbar.querySelector('.brand');
 document.body.dataset.appShell='native';document.body.dataset.uiVersion='5.3';
 brand.querySelector('strong').setAttribute('role','heading');brand.querySelector('strong').setAttribute('aria-level','1');
 topbar.prepend($('session-menu'));const actions=topbar.querySelector('.top-actions'),more=node('button','icon-button');more.id='app-more';more.type='button';more.append(uiIcon('more'));more.setAttribute('aria-label','更多操作');more.setAttribute('aria-haspopup','dialog');more.setAttribute('aria-controls','app-menu');more.setAttribute('aria-expanded','false');
 const modeSwitch=node('div','mode-switch');modeSwitch.setAttribute('role','group');modeSwitch.setAttribute('aria-label','工作区模式');
 const modeChat=node('button','mode-switch-option','聊天'),modeWork=node('button','mode-switch-option','工作');
 modeChat.type='button';modeWork.type='button';modeChat.dataset.mode='chat';modeWork.dataset.mode='work';modeSwitch.append(modeChat,modeWork);topbar.insertBefore(modeSwitch,actions);
 modeChat.onclick=()=>window.BridgeDashboard?.navigate('chat');modeWork.onclick=()=>window.BridgeDashboard?.navigate('home');
 // 5.5 shell: a real sidebar owns workspace navigation. The legacy mode switch
 // moves into the sidebar footer so the status line stays quiet.
 const navToggle=node('button','icon-button');navToggle.id='app-nav';navToggle.type='button';navToggle.append(uiIcon('menu'));navToggle.setAttribute('aria-label','打开导航');navToggle.setAttribute('aria-expanded','false');
 topbar.prepend(navToggle);
 const navScrim=node('div','v5-scrim');navScrim.id='v5-scrim';navScrim.hidden=true;
 const sidebar=node('aside','v5-sidebar');sidebar.id='v5-sidebar';sidebar.setAttribute('aria-label','侧边导航');sidebar.setAttribute('aria-hidden','true');
 const sbHead=node('header','v5-sb-head'),sbBrand=node('div','v5-sb-brand','inkvoy');
 const sbClose=node('button','icon-button');sbClose.id='v5-nav-close';sbClose.type='button';sbClose.append(uiIcon('close'));sbClose.setAttribute('aria-label','关闭导航');
 sbHead.append(sbBrand,sbClose);
 const sbProject=node('div','v5-sb-project'),sbProjectLabel=node('span','v5-sb-label','项目');
 const sbProjectName=node('strong','v5-sb-project-name','inkvoy'),sbProjectMeta=node('span','v5-sb-meta','main · 工作区');
 sbProject.append(sbProjectLabel,sbProjectName,sbProjectMeta);
 const sbNav=node('nav','v5-sb-nav');
 const sbNew=node('button','v5-sb-new');sbNew.type='button';sbNew.setAttribute('aria-label','新建会话');sbNew.append(uiIcon('plus'));sbNew.onclick=()=>{closeNav();document.getElementById('chat-new')?.click();},navItems=new Map();
 for(const [page,icon,label] of [['chat','chat','对话'],['home','home','工作'],['files','files','文件'],['terminal','terminal','终端'],['computer','browser','浏览器']]){
  const item=node('button','v5-nav-item');item.type='button';item.dataset.v5Nav=page;item.append(uiIcon(icon),node('span','',label));
  item.onclick=()=>{closeNav();window.BridgeDashboard?.navigate(page);};sbNav.append(item);navItems.set(page,item);
 }
 const sbFoot=node('footer','v5-sb-foot');
 const settingsItem=node('button','v5-nav-item');settingsItem.type='button';settingsItem.dataset.v5Nav='settings';settingsItem.append(uiIcon('settings'),node('span','','设置'));
 settingsItem.onclick=()=>{closeNav();window.BridgeDashboard?.navigate('settings');};navItems.set('settings',settingsItem);
 modeSwitch.classList.add('v5-mode-switch');
 const sbSessions=node('section','v5-sb-sessions'),sbSessionsLabel=node('span','v5-sb-label','最近会话'),sbSessionList=node('div','v5-sb-session-list');sbSessions.append(sbSessionsLabel,sbSessionList);
 let sessionKey='';
 function renderSidebarSessions(state){
  const sessions=(state.sessions||[]).filter(s=>!s.archived).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.updatedAt||0)-(a.updatedAt||0)).slice(0,6);
  const key=sessions.map(s=>s.id+'|'+s.title+'|'+s.status).join('~')+'|'+state.selected;
  if(key===sessionKey)return;sessionKey=key;sbSessionList.replaceChildren();
  if(!sessions.length){sbSessionList.append(node('p','v5-sb-session-empty','暂无会话'));return;}
  for(const session of sessions){
   const item=node('button','v5-sb-session');item.type='button';item.dataset.sessionId=session.id;
   const dot=node('span','v5-sb-session-dot');dot.dataset.state=session.status||'idle';
   const label=node('span','v5-sb-session-title',session.title||'未命名会话');
   item.append(dot,label);
   if(session.id===state.selected)item.classList.add('active');
   item.onclick=()=>{closeNav();const index=sessions.findIndex(s=>s.id===session.id);const target=document.querySelectorAll('#client-sessions > button')[index];if(target)target.click();};
   sbSessionList.append(item);
  }
 }
 sbFoot.append(settingsItem,modeSwitch);
 sbProject.append(sbNew);
 sidebar.append(sbHead,sbProject,sbNav,sbSessions,sbFoot);
 app.append(navScrim,sidebar);
 let navOpen=false;
 function openNav(){if(navOpen)return;navOpen=true;navScrim.hidden=false;sidebar.dataset.open='true';sidebar.setAttribute('aria-hidden','false');navToggle.setAttribute('aria-expanded','true');closeOverlays();}
 function closeNav(){if(!navOpen)return;navOpen=false;navScrim.hidden=true;sidebar.dataset.open='false';sidebar.setAttribute('aria-hidden','true');navToggle.setAttribute('aria-expanded','false');}
 navToggle.onclick=()=>{if(navOpen)closeNav();else openNav();};
 sbClose.onclick=closeNav;navScrim.onclick=closeNav;
 sidebar.addEventListener('click',event=>{if(event.target.closest('[data-v5-nav]'))closeNav();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navOpen){event.preventDefault();closeNav();}},true);
 window.addEventListener('bridge:navigate',closeNav);
 const scrim=node('div','app-menu-scrim workspace-overlay');scrim.id='app-menu';scrim.hidden=true;
 const panel=node('section','app-menu-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','app-menu-title');
 const heading=node('header'),title=node('h2','','工作区操作'),dismiss=node('button','icon-button');title.id='app-menu-title';dismiss.id='app-menu-close';dismiss.setAttribute('aria-label','关闭更多操作');dismiss.append(uiIcon('close'));heading.append(title,dismiss);panel.append(heading);
 const primary=node('div','app-menu-section'),tools=node('div','app-menu-section'),preferences=node('div','app-menu-section');
 function routeButton(id,icon,label,run){const b=node('button','app-menu-action');b.id=id;b.type='button';b.append(uiIcon(icon),node('span','',label));b.onclick=run;return b;}
 primary.append(routeButton('app-menu-model','connect','模型与 API',()=>$('model-settings-open').click()));
 for(const [id,label]of [['command-open','搜索与快速操作'],['context-toggle','当前工作区信息']]){const button=$(id);button.classList.add('app-menu-action');button.append(node('span','app-menu-label',label));primary.append(button);}
 for(const [page,icon,label]of [['files','files','项目文件'],['terminal','terminal','终端'],['computer','browser','浏览器']])tools.append(routeButton('app-menu-'+page,icon,label,()=>BridgeDashboard.navigate(page)));
 const theme=$('theme');theme.classList.add('app-menu-action');preferences.append(theme,routeButton('app-menu-settings','appearance','外观与设置',()=>BridgeDashboard.navigate('settings')));
 const help=actions.querySelector('[data-action="help"]');if(help){help.id='app-menu-help';help.classList.add('app-menu-action');help.removeAttribute('data-icon');help.replaceChildren(uiIcon('docs'),node('span','app-menu-label','使用帮助'));preferences.append(help);}
 panel.append(primary,tools,preferences);scrim.append(panel);app.append(scrim);
 const routeTools=node('div','app-route-actions'),routeButtons=new Map();
 for(const [page,id]of [['files','file-refresh'],['accounts','accounts-refresh'],['extensions','extensions-refresh'],['tools','runtime-refresh']]){const button=$(id);button.classList.add('icon-button');button.hidden=true;routeButtons.set(page,button);routeTools.append(button);}
 actions.replaceChildren($('chat-new'),routeTools,more);
 $('chat-new').addEventListener('click',()=>{if(!client.snapshot().active)window.BridgeDashboard?.navigate('chat');});
 const form=$('chat-form'),toolbar=document.querySelector('.composer-toolbar'),surface=node('div','composer-surface');toolbar.before(surface);
 const modes=$('composer-modes'),browserShortcut=$('client-browser');
 // The composer has one compact primary row. Secondary controls live in the
 // existing options popover so they cannot collide with the input or send
 // action at narrow widths.
 if(modes){
  modes.classList.add('composer-tools-panel');
  modes.setAttribute('aria-label','工具与模式');
  if(toolbar) modes.append(toolbar);
  if(browserShortcut) modes.append(browserShortcut);
 }
 surface.append($('composer-expand'),form);
 let phase='closed',animation,epoch=0,previousFocus,route=document.body.dataset.page||'chat',lastTitle='',renderKey='';
 const reduced=()=>document.hidden||document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const inert=value=>document.querySelectorAll('.page,.topbar,.bottom-nav').forEach(n=>n.inert=value);
 function animateTo(open){
  const computed=getComputedStyle(panel),from={opacity:computed.opacity,transform:computed.transform==='none'?'translateY(0px)':computed.transform};animation?.cancel();
  if(reduced())return Promise.resolve();
  animation=panel.animate([open&&phase==='opening'?{opacity:0,transform:'translateY(18px)'}:from,{opacity:open?1:0,transform:open?'translateY(0px)':'translateY(12px)'}],{duration:open?280:160,easing:open?'cubic-bezier(.16,1,.3,1)':'cubic-bezier(.4,0,1,1)',fill:'both'});
  return animation.finished;
 }
 function close(){
  if(phase!=='open'&&phase!=='opening')return false;const turn=++epoch;phase='closing';scrim.dataset.closing='true';more.setAttribute('aria-expanded','false');inert(false);previousFocus?.focus();
  const done=()=>{if(epoch!==turn)return;phase='closed';scrim.hidden=true;animation?.cancel();animation=null;window.BridgeDashboard?.layout();};
  animateTo(false).then(done,()=>{});window.BridgeDashboard?.layout();return true;
 }
 function open(){
  if(phase==='open'||phase==='opening'){close();return;}
  const reopening=phase==='closing';closeOverlays();const turn=++epoch;previousFocus=document.activeElement;phase=reopening?'open':'opening';scrim.hidden=false;scrim.dataset.closing='false';inert(true);more.setAttribute('aria-expanded','true');dismiss.focus();
  animateTo(true).then(()=>{if(epoch===turn)phase='open';},()=>{});window.BridgeDashboard?.layout();
 }
 more.onclick=open;dismiss.onclick=close;
 // Close before the original model / theme / inspector handler opens its next surface.
 panel.addEventListener('click',event=>{if(event.target.closest('button'))close();},true);
 scrim.addEventListener('click',event=>{if(event.target===scrim)close();});
 scrim.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
  if(event.key==='Tab'){const buttons=[...panel.querySelectorAll('button:not(:disabled)')].filter(n=>n.getClientRects().length),first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 });
 function themeLabel(){if(!theme.querySelector('.app-menu-label'))theme.append(node('span','app-menu-label',document.body.classList.contains('dark')?'切换浅色主题':'切换深色主题'));else theme.querySelector('.app-menu-label').textContent=document.body.classList.contains('dark')?'切换浅色主题':'切换深色主题';if(reduced())try{animation?.finish();}catch{}}
 new MutationObserver(themeLabel).observe(document.body,{attributes:true,attributeFilter:['class']});themeLabel();queueMicrotask(themeLabel);
 function render(state=client.snapshot(),session=client.current()){
  const hasMessages=!!session?.messages?.length,text=route==='chat'?(hasMessages?session.title:'Inkvoy'):(routes[route]||'工作区');
  const profile=providers?.current(),key=[route,text,hasMessages,session?.status,profile?.id,profile?.name].join('|');if(key===renderKey)return;renderKey=key;
  document.body.dataset.taskState=session?.status||'idle';document.body.dataset.hasMessages=String(hasMessages);brand.dataset.hasTitle=String(hasMessages||route!=='chat');
  $('chat-new').hidden=route!=='chat';routeTools.hidden=!routeButtons.has(route);for(const [page,button]of routeButtons)button.hidden=page!==route;
  if(text!==lastTitle){lastTitle=text;const label=brand.querySelector('strong');label.textContent='inkvoy';label.title='inkvoy';const pageName=document.getElementById('workspace-page-name');if(pageName)pageName.textContent=route==='chat'?(hasMessages?'会话 · '+session.title:'新会话'):(routes[route]||'工作区');if(!reduced())label.animate([{opacity:.3,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'});}
  const crumbText=route==='chat'?(hasMessages?'会话 · '+session.title:'新会话'):(routes[route]||'工作区');const syncCrumb=()=>document.querySelectorAll('.workspace-page-name').forEach(n=>n.textContent=crumbText);syncCrumb();setTimeout(syncCrumb,0);
  const work=route!=='chat';modeChat.setAttribute('aria-pressed',String(!work));modeWork.setAttribute('aria-pressed',String(work));
  more.title=(profile?.name||'DeepSeek 网页')+' · 工作区操作';
  for(const [page,item] of navItems)item.classList.toggle('active',page===route);
  renderSidebarSessions(state);
  const projectName=session?.project||'inkvoy';sbProjectName.textContent=projectName;sbProjectName.title=projectName;
  sbProjectMeta.textContent=routes[route]||'工作区';
 }
 window.addEventListener('bridge:navigate',event=>{close();route=event.detail;render();});render();
 return {render,close,open,get phase(){return phase;}};
}
