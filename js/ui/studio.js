import {mountWorkspacePages,mountWorkspaceDrawer} from './v4/pages.js';
import {enhanceWorkspace} from './v4/workspace.js';
import {createProcessView} from './processes.js';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { companionState } from './companion.js';
import { createReplyView } from './replies.js';
import { createChangeView } from './changes.js';
import { createModelSettings } from './model-settings.js';
import {createComputerView} from './computer.js';
import {createQuestionView} from './questions.js';
import {createAttachments} from './attachments.js';
import {createSettingsHub} from './settings-hub.js';
import {createComposer} from './composer.js';
import {createWorkView} from './workflows.js';
import {installBrowserScripts} from './browser-scripts.js';

const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shellQuote=s=>"'"+String(s).replaceAll("'","'\\''")+"'";
const labels={idle:'准备开始',generating:'正在生成',compacting:'正在压缩上下文',tools:'工具执行中',cancelling:'正在停止',completed:'已完成',needs_input:'等待你的补充',cancelled:'已停止',failed:'需要处理',interrupted:'上次运行中断',budget:'已达本轮预算'};
const uiIcon=(path)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
const icons={code:uiIcon('<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>'),spark:uiIcon('<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/>'),search:uiIcon('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'),folder:uiIcon('<path d="M3 7h6l2-3h5l2 3h3v13H3Z"/>'),send:uiIcon('<path d="M12 20V4m-6 6 6-6 6 6"/>'),copy:uiIcon('<rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V4H4v12h4"/>')};
export function initStudio({client,native,providers,agentTools,extensions}) {
  const nav=document.querySelector('.bottom-nav'); if(!nav)return;
  mountWorkspacePages(nav);
  nav.innerHTML=`<button data-navigate="chat" class="active" aria-current="page"><span>✦</span><span>对话</span></button><button data-navigate="files"><span>▤</span><span>文件</span></button><button data-navigate="terminal"><span>›_</span><span>终端</span></button><button data-navigate="computer"><span data-icon="globe"></span><span>浏览器</span></button><button data-navigate="home"><span data-icon="grid"></span><span>工作台</span><i id="task-nav-dot" hidden></i></button>`;
  document.querySelector('.brand strong').textContent='Inkvoy';
  document.querySelector('.brand>div>span').textContent='本机工作室';
  const $=id=>document.getElementById(id);const toast=t=>window.BridgeDashboard?.toast(t);
  const wrap=fn=>async event=>{const button=event?.currentTarget?.tagName==='BUTTON'?event.currentTarget:null;const disabled=button?.disabled;if(button){button.disabled=true;button.setAttribute('aria-busy','true');}try{await fn(event);}catch(e){toast(e?.message||'操作失败，请检查环境状态');}finally{if(button){button.disabled=!!disabled;button.removeAttribute('aria-busy');}}};
  const click=(id,fn)=>$(id).addEventListener('click',wrap(fn));
  let changeView,modelView,mediaView,workspaceView,composerView,workView,browserScriptView,cached,renderFingerprint='',dir='',file='',dirty=false,currentTerm,terminalSerial=0,activePage='chat',runtimeCurrent={},runtimeRevision=0,showArchived=false;const terminals=new Map();
  const scrim=mountWorkspaceDrawer(icons);
  $('app').append(scrim);$('drawer-sessions').append($('session-picker'));$('session-picker').hidden=false;
  const search=document.createElement('div');search.className='drawer-search';search.innerHTML=icons.search+'<input id="session-search" type="search" placeholder="搜索会话…" aria-label="搜索本机会话">';$('drawer-new').after(search);$('drawer-new').innerHTML='<span>＋</span> 新建会话';
  $('session-search').addEventListener('input',()=>render(client.snapshot()));
  $('client-agent').innerHTML=icons.code+'Agent';$('client-thinking').innerHTML=icons.spark+'思考';$('client-search').innerHTML=icons.search+'搜索';$('chat-send').innerHTML=icons.send;
  const attach=document.createElement('button');attach.type='button';attach.id='composer-import';attach.textContent='＋';attach.setAttribute('aria-label','导入文件到当前项目');$('composer-options').before(attach);click('composer-import',()=>NativeBridge.uiAction('import-file',JSON.stringify({project:project()})));
  const sessionManage=document.createElement('details');sessionManage.id='session-manage';
  sessionManage.innerHTML='<summary>管理当前对话</summary>';
  const edit=$('session-title').closest('.session-edit'),hint=edit.nextElementSibling;
  edit.before(sessionManage);sessionManage.append(edit,hint);
  function closeOptions(){ $('composer-modes').hidden=true;$('composer-options').setAttribute('aria-expanded','false'); }
  click('composer-options',()=>{const open=$('composer-modes').hidden;$('composer-modes').hidden=!open;$('composer-options').setAttribute('aria-expanded',String(open));});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#composer-options,#composer-modes'))closeOptions();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('composer-modes').hidden){closeOptions();$('composer-options').focus();e.preventDefault();}});
  document.addEventListener('visibilitychange',()=>{document.body.toggleAttribute('data-ui-paused',document.hidden);});
  let drawerFocus;
  function closeDrawer(){if(workView?.close())return true;if(browserScriptView?.close())return true;if(composerView?.close())return true;if(workspaceView?.close())return true;if(mediaView?.close())return true;if(modelView?.close())return true;if(changeView?.close())return true;if(scrim.hidden)return false;scrim.hidden=true;$('session-menu').setAttribute('aria-expanded','false');document.querySelectorAll('.page,.topbar,.bottom-nav').forEach(n=>n.inert=false);drawerFocus?.focus();return true;}
  function openDrawer(event){closeOptions();drawerFocus=event?.currentTarget||document.activeElement;scrim.hidden=false;$('session-menu').setAttribute('aria-expanded','true');document.querySelectorAll('.page,.topbar,.bottom-nav').forEach(n=>n.inert=true);$('drawer-close').focus();}
  click('drawer-close',closeDrawer);click('drawer-new',()=>{if($('chat-new').disabled)return;$('chat-new').click();closeDrawer();});click('drawer-theme',()=>$('theme').click());$('display-orientation').onchange=e=>NativeBridge.uiAction('orientation',JSON.stringify({mode:e.target.value}));
  scrim.addEventListener('click',event=>{if(event.target===scrim)closeDrawer();});
  scrim.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeDrawer();}if(event.key==='Tab'){const nodes=[...scrim.querySelectorAll('button:not(:disabled),input:not(:disabled),summary,[tabindex="0"]')].filter(n=>n.getClientRects().length),first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
  scrim.querySelectorAll('[data-drawer-page]').forEach(b=>b.addEventListener('click',()=>{closeDrawer();BridgeDashboard.navigate(b.dataset.drawerPage);}));
  scrim.querySelectorAll('[data-permission]').forEach(b=>b.addEventListener('click',()=>NativeBridge.uiAction('permission-'+b.dataset.permission,'{}')));
  const access=document.createElement('button');access.id='permissions-open';access.className='permissions-entry';access.textContent='权限与后台运行  ↗';$('page-home').querySelector('.page-heading').after(access);click('permissions-open',e=>{openDrawer(e);$('drawer-settings').open=true;$('drawer-settings').scrollIntoView({block:'nearest'});});
  function platformState(state){workspaceView?.platform(state);document.querySelectorAll('[data-display-orientation]').forEach(n=>{n.value=state.orientation||'auto';});const p=state.permissions||{};for(const [key,property]of [['files','allFiles'],['notifications','notifications'],['battery','batteryUnrestricted']])$('permission-'+key+'-status').textContent=p[property]===true?'已开启 ✓':p[property]===false?'去开启 ›':'查看设置 ›';$('permission-summary').textContent=p.allFiles&&p.notifications&&p.batteryUnrestricted?'权限已就绪':'按需开启，系统授权后自动更新';$('drawer-service-state').textContent=(state.running?'● 本机桥运行中':'○ 本机桥已停止')+(state.busy?' · 正在处理任务':'')+' · '+(state.version||'3.1.0');}
  const archivedButton=document.createElement('button');archivedButton.id='session-archived-toggle';archivedButton.textContent='显示归档';$('session-picker').append(archivedButton);
  const project=()=>client.current()?.project||client.create().project;
  async function openProjectFile(p,path){
    if(client.current()?.project!==p)throw new Error('请先切回此文件所属的项目');
    if(dirty)throw new Error('先保存或关闭编辑器中的改动');
    if(/\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(path)){const image=await native('file.attachment',{project:p,path});if(image.image){mediaView.openImage(image);return;}}
    const r=await native('file.read',{project:p,path,limit:1048576});if(client.current()?.project!==p)return;if(r.truncated)throw new Error('文件过大，请用终端查看');
    BridgeDashboard.navigate('files');file=path;dir=path.split('/').slice(0,-1).join('/');$('file-path').value=path;$('file-content').value=r.content;$('file-editor').hidden=false;dirty=false;$('file-dirty').textContent='';$('analysis-path').value=path;
  }
  changeView=createChangeView({native,openFile:openProjectFile,busy:()=>!!client.snapshot().active,notify:toast});
  const oldModel=document.querySelector('.composer-model'),modelButton=document.createElement('button');modelButton.type='button';modelButton.className='composer-model';modelButton.id='model-picker';modelButton.setAttribute('aria-label','选择模型与 API 连接');oldModel.replaceWith(modelButton);
  if(providers)modelView=createModelSettings({providers,client,notify:toast,closeDrawer});
  mediaView=createAttachments({native,project,openFile:openProjectFile,notify:toast});
  const replyView=createReplyView({container:$('chat-messages'),copy:text=>NativeBridge.uiAction('copy-text',JSON.stringify({text})),openFile:openProjectFile,openImage:image=>mediaView.openImage(image),showChange:(p,id)=>changeView.show(p,id),openLink:url=>NativeBridge.uiAction('open-link',JSON.stringify({url})),notify:toast});
  click('task-companion',()=>{const pet=$('task-companion');pet.classList.remove('is-greeting');requestAnimationFrame(()=>pet.classList.add('is-greeting'));replyView.revealCurrent();});$('task-companion').addEventListener('animationend',event=>{if(event.animationName==='pet-greet')$('task-companion').classList.remove('is-greeting');});
  function render(state) {
    cached=state;const s=client.current(),isActive=state.active===s?.id;mediaView?.render();
    $('session-current').textContent=s?.title||'新会话';if(document.activeElement!==$('session-title'))$('session-title').value=s?.title||'';$('session-pin').textContent=s?.pinned?'★':'☆';
    $('session-manage').hidden=!s;$('session-pin').hidden=!s;$('chat-stage').classList.toggle('is-empty',!s?.messages.length);
    $('drawer-new').disabled=!!state.active;
    const query=$('session-search').value.trim().toLocaleLowerCase();
    const visibleSessions=[...state.sessions].filter(item=>(showArchived||!item.archived||item.id===state.selected)&&(!query||item.title.toLocaleLowerCase().includes(query))).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.updatedAt-a.updatedAt);
    const listKey=JSON.stringify([state.selected,query,showArchived,visibleSessions.map(({id,title,pinned,archived})=>[id,title,pinned,archived])]);
    if(listKey!==renderFingerprint){renderFingerprint=listKey;$('client-sessions').replaceChildren(...visibleSessions.map(session=>{const b=document.createElement('button');b.className=session.id===state.selected?'selected':'';const label=document.createElement('span');label.className='drawer-session-label';label.textContent=(session.pinned?'★ ':'')+session.title+(session.archived?' · 已归档':'');b.append(label);b.addEventListener('click',()=>{if(dirty){toast('先保存或关闭文件改动，再切换项目');return;}client.select(session.id);closeDrawer();dir='';file='';$('file-editor').hidden=true;renderFingerprint='';});return b;}));
    if(!visibleSessions.length)$('client-sessions').innerHTML='<p class="drawer-empty">'+(query?'没有找到匹配的会话':'暂无对话')+'</p>';}
    if(activePage==='chat'||activePage==='computer'&&document.getElementById('computer-workspace')?.dataset.split==='true')replyView.render(s,isActive,state.draft,false,state.toolOutput);
    changeView.refresh();
    const companion=companionState(s,isActive);
    $('client-progress').hidden=!companion.visible;$('client-progress').classList.toggle('is-finished',!isActive);
    $('task-companion').dataset.pose=companion.pose;$('task-companion').setAttribute('aria-label','小墨：'+companion.label+'，点击展开执行过程');
    $('client-phase').textContent=state.draft&&state.draft.sessionId===s?.id?(state.draft.phase==='searching'?'搜索网页':state.draft.phase==='repairing'?'校验回复格式':state.draft.reasoning&&!state.draft.content?'正在思考':'正在回复'):companion.label;$('client-progress').dataset.active=String(isActive);updateWorkStatus();
    $('client-stop').hidden=!isActive;$('composer-options').disabled=!!state.active;if(state.active)closeOptions();
    $('client-notice').hidden=!(s?.notice||state.storage?.error);$('client-notice').querySelector('span').textContent=s?.notice||state.storage?.error||'';$('client-resume').hidden=isActive||s?.status==='completed';
    $('chat-send').disabled=!!state.active&&!/^\//.test($('chat-input').value.trim());$('chat-input').disabled=false;$('chat-new').disabled=!!state.active;
    $('client-stop').disabled=s?.status==='cancelling';
    for(const [id,key]of [['client-agent','agent'],['client-thinking','thinking'],['client-search','search']]){const enabled=s?.settings?.[key]??key!=='thinking';$(id).classList.toggle('selected',enabled);$(id).setAttribute('aria-pressed',String(enabled));$(id).disabled=!!state.active;}
    modelView?.render();workspaceView?.render(state,s,companion);composerView?.render(state);workView?.render(state);
  }
  click('chat-new',()=>{if(dirty)throw new Error('先保存或关闭文件改动，再新建项目');client.create();dir='';$('file-editor').hidden=true;});
  click('session-menu',openDrawer);
  click('session-pin',()=>{const s=client.current();if(s)client.update(s.id,{pinned:!s.pinned});});
  click('session-rename',()=>{const s=client.current();if(s)client.update(s.id,{title:$('session-title').value});});
  click('session-archive',()=>{const s=client.current();if(s)client.update(s.id,{archived:!s.archived});});
  click('session-archived-toggle',()=>{showArchived=!showArchived;archivedButton.textContent=showArchived?'隐藏归档':'显示归档';render(client.snapshot());});
  let deleteArmed=0;
  click('session-delete',()=>{const s=client.current();if(!s)return;if(dirty)throw new Error('先保存或关闭文件改动');if(Date.now()-deleteArmed>4000){deleteArmed=Date.now();toast('再次点击删除本机聊天记录；项目文件保留');return;}client.remove(s.id);deleteArmed=0;});
  click('session-export',()=>{const s=client.current();if(s)NativeBridge.uiAction('export-chat',JSON.stringify({id:s.id}));});
  $('chat-form').addEventListener('submit',wrap(async e=>{e.preventDefault();const text=$('chat-input').value;if(composerView?.isBusy())throw new Error('正在读取引用，请稍候再发送。');if(!text.trim()&&!mediaView.current().length&&!composerView.references().length)return;if(/^\//.test(text.trim())){await composerView.command(text);$('chat-input').value='';composerView.sent();return;}if(client.snapshot().active)throw new Error('任务正在运行；可以先写草稿，或用 /stop 停止。');await client.send(text,mediaView.current(),composerView.references(),()=>{mediaView.take();composerView.takeReferences();$('chat-input').value='';composerView.sent();});}));
  $('chat-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){$('chat-form').requestSubmit();e.preventDefault();}});
  click('client-stop',()=>client.stop());click('client-resume',()=>client.resume());

  $('chat-input').addEventListener('input',()=>{$('chat-input').style.height='auto';$('chat-input').style.height=Math.min(180,Math.max(48,$('chat-input').scrollHeight))+'px';$('chat-send').disabled=!!client.snapshot().active&&!/^\//.test($('chat-input').value.trim());});
  for(const [id,key]of [['client-agent','agent'],['client-search','search']])click(id,()=>{const s=client.current()||client.create();client.settings({[key]:!s.settings[key]});});
  click('client-thinking',()=>modelView?.reasoning());
  async function loadFiles() {
    const currentProject=project(),currentDirectory=dir;
    const data=await native('file.list',{project:currentProject,path:currentDirectory});if(project()!==currentProject||dir!==currentDirectory)return;$('file-directory').textContent='/workspace'+(dir?'/'+dir:'');
    $('file-list').replaceChildren(...data.entries.map(entry=>{
      const path=(currentDirectory?currentDirectory+'/':'')+entry.name,row=document.createElement('div'),b=document.createElement('button');row.className='studio-file-row';b.className='file-entry';b.innerHTML=`<span>${entry.directory?'▰':'▤'}</span><strong>${escapeHTML(entry.name)}</strong><small>${entry.directory?'文件夹':entry.symlink?'符号链接':entry.bytes+' B'}</small><i>›</i>`;
      b.addEventListener('click',wrap(async()=>{if(entry.directory){dir=path;await loadFiles();}else{if(dirty){toast('请先保存或关闭当前改动');return;}const r=await native('file.read',{project:currentProject,path,limit:1048576});if(project()!==currentProject)return;if(r.truncated){toast('文件过大，请用终端查看；不会打开不完整编辑内容');return;}file=path;$('file-path').value=path;$('file-content').value=r.content;$('file-editor').hidden=false;dirty=false;$('file-dirty').textContent='';$('analysis-path').value=path;}}));row.append(b);
      if(!entry.directory){for(const [name,label,action]of [['analyze','分析',()=>{$('analysis-path').value=path;BridgeDashboard.navigate('tools');}],['export','导出',()=>NativeBridge.uiAction('export-file',JSON.stringify({project:currentProject,path}))]]){const button=document.createElement('button');button.className='file-row-'+name;button.textContent=label;button.setAttribute('aria-label',label+' '+entry.name);button.addEventListener('click',wrap(action));row.append(button);}}
      return row;
    }));
    if(!data.entries.length)$('file-list').innerHTML='<div class="file-empty">这个项目还是空的<br><span>导入文件，或者让 AI 创建第一个文件。</span></div>';
  }
  click('file-refresh',loadFiles);click('file-parent',()=>{dir=dir.split('/').slice(0,-1).join('/');return loadFiles();});
  click('file-import',()=>NativeBridge.uiAction('import-file',JSON.stringify({project:project()})));
  click('file-new',()=>{if(dirty){toast('请先保存当前改动');return;}file='';$('file-path').value=dir?dir+'/':'';$('file-content').value='';$('file-editor').hidden=false;$('file-path').focus();});
  $('file-content').addEventListener('input',()=>{dirty=true;$('file-dirty').textContent='未保存';});
  $('file-path').addEventListener('input',()=>{dirty=true;$('file-dirty').textContent='未保存';});
  click('file-save',async()=>{const path=$('file-path').value;await native('file.write',{project:project(),path,content:$('file-content').value});file=path;dirty=false;$('file-dirty').textContent='已保存';toast('文件已保存');await loadFiles();});
  click('file-close',()=>{if(dirty&&$('file-close').dataset.armed!=='yes'){$('file-close').dataset.armed='yes';toast('再次点击关闭，放弃未保存改动');return;}dirty=false;$('file-close').dataset.armed='';$('file-editor').hidden=true;});
  click('file-export',()=>{if(!file||dirty)throw new Error('请先保存文件');NativeBridge.uiAction('export-file',JSON.stringify({project:project(),path:file}));});
  click('file-analyze',()=>{$('analysis-path').value=$('file-path').value;BridgeDashboard.navigate('tools');});
  click('file-find',async()=>{const r=await native('file.search',{project:project(),path:dir,query:$('file-query').value});$('file-results').replaceChildren(...r.matches.map(m=>{const p=document.createElement('p');p.textContent=`${m.path}:${m.line}  ${m.text}`;return p;}));if(!r.matches.length)$('file-results').textContent='没有匹配结果';});
  function selectTerminal(id){currentTerm=id;for(const [key,value]of terminals){value.host.hidden=key!==id;}renderTermTabs();requestAnimationFrame(()=>{const t=terminals.get(id);if(t){try{t.fit.fit();t.term.focus();}catch{}}});}
  function renderTermTabs(){$('terminal-tabs').replaceChildren(...[...terminals].map(([id,t])=>{const b=document.createElement('button');b.classList.toggle('active',id===currentTerm);b.textContent=t.title+(t.exitCode!==undefined?' · '+t.exitCode:'');b.addEventListener('click',()=>selectTerminal(id));return b;}));}
  async function startTerminal(existingId=null){
    if(terminals.size>=4)throw new Error('最多同时打开 4 个终端');
    const terminalProject=project(),terminalTitle=client.current()?.title||'工作区';
    $('terminal-state').textContent='准备环境…';if(!existingId)try{await native('runtime.ensure',{project:terminalProject});}catch(e){$('terminal-state').textContent='环境启动失败 · 到工具中心查看原因';void refreshRuntime().catch(()=>{});throw e;}
    const host=document.createElement('div');host.className='xterm-session';$('terminal-host').append(host);
    const term=new Terminal({fontFamily:'ui-monospace, "Noto Sans Mono", monospace',fontSize:13,scrollback:10000,cursorBlink:true,convertEol:false,allowProposedApi:false,theme:{background:'#11141b',foreground:'#d6deeb',cursor:'#91b6ff',selectionBackground:'#304666',black:'#11141b',red:'#f18c96',green:'#8fcea8',yellow:'#e6c487',blue:'#92b6ff',magenta:'#bca4df',cyan:'#8fcac9',white:'#d6deeb'}});const fit=new FitAddon();term.loadAddon(fit);term.open(host);try{fit.fit();}catch{}
    let r;try{r=existingId?{id:existingId}:await native('terminal.open',{project:terminalProject,rows:term.rows,cols:term.cols});}catch(e){term.dispose();host.remove();throw e;}
    const id=r.id;terminals.set(id,{term,fit,host,project:terminalProject,title:'bash '+(++terminalSerial)+' · '+terminalTitle.slice(0,12)});$('terminal-empty').hidden=true;
    term.onData(data=>{void native('terminal.input',{id,data}).catch(e=>toast(e.message));});term.onResize(({rows,cols})=>{void native('terminal.resize',{id,rows,cols}).catch(()=>{});});selectTerminal(id);$('terminal-state').textContent='已连接 · 真实 PTY';
    const attached=await native('terminal.attach',{id});if(attached.truncated)term.writeln('[重连缓存已截断，以下为最近输出]\r\n');if(attached.buffer)term.write(Uint8Array.from(atob(attached.buffer),c=>c.charCodeAt(0)));if(attached.exited){terminals.get(id).exitCode=attached.exitCode;term.writeln('\r\n[进程退出：'+attached.exitCode+']');renderTermTabs();}
  }
  click('terminal-start',()=>startTerminal());click('terminal-add',()=>startTerminal());
  const keyboard=document.createElement('button');keyboard.id='terminal-keyboard';keyboard.textContent='⌨';keyboard.setAttribute('aria-label','显示终端键盘');$('terminal-close').before(keyboard);click('terminal-keyboard',()=>{terminals.get(currentTerm)?.term.focus();NativeBridge.uiAction('terminal-keyboard','{}');});
  const paste=document.createElement('button');paste.id='terminal-paste';paste.textContent='粘贴';$('terminal-copy').before(paste);click('terminal-paste',()=>NativeBridge.uiAction('paste-terminal','{}'));
  click('terminal-close',async()=>{const t=terminals.get(currentTerm);if(!t)return;await native('terminal.close',{id:currentTerm});t.term.dispose();t.host.remove();terminals.delete(currentTerm);selectTerminal(terminals.keys().next().value);$('terminal-empty').hidden=terminals.size>0;});
  document.querySelectorAll('[data-key]').forEach(b=>b.addEventListener('click',wrap(async()=>{if(!currentTerm)return;await native('terminal.input',{id:currentTerm,data:b.dataset.key});terminals.get(currentTerm)?.term.focus();})));
  click('terminal-clear',()=>terminals.get(currentTerm)?.term.clear());click('terminal-copy',()=>{const text=terminals.get(currentTerm)?.term.getSelection();if(!text)throw new Error('长按并选中要复制的终端文本');NativeBridge.uiAction('copy-text',JSON.stringify({text}));});
  new ResizeObserver(()=>{if(activePage==='terminal')for(const t of terminals.values())if(!t.host.hidden)try{t.fit.fit();}catch{}}).observe($('terminal-host'));
  function runtimeState(r) {
    runtimeCurrent=r;
    $('runtime-state').textContent=r.error?'初始化需要处理':r.installing?'正在初始化':r.ready?'离线环境已就绪':'首次使用需要解压环境';$('runtime-detail').textContent=r.error||r.message||'必需工具已包含在安装包中';$('runtime-progress').hidden=!r.installing;$('runtime-progress').value=r.progress||0;$('runtime-install').disabled=!!r.installing;$('runtime-test').disabled=!r.ready||!!r.testing;$('runtime-install').textContent=r.error?'重试初始化':r.ready?'校验环境':'初始化环境';
    $('runtime-tools').replaceChildren(...(r.tools||[]).map(t=>{const n=document.createElement('div');n.className='tool-tile';n.innerHTML=`<span>${escapeHTML(t.kind||'CLI')}</span><strong>${escapeHTML(t.name)}</strong><p>${escapeHTML(t.version||'镜像内置')}</p><small>${r.verified?'✓ 自检通过':r.ready?'已解压 · 待自检':'离线收录'}</small>`;return n;}));
  }
  const formatTime=ms=>{const sec=Math.max(0,Math.floor(ms/1000));return sec>=60?Math.floor(sec/60)+'分'+sec%60+'秒':sec+'秒';};
  function updateWorkStatus(){
    const s=client.current();if(!s)return;const active=cached?.active===s.id;
    const elapsed=(active?Date.now():s.runFinishedAt||s.updatedAt)-(s.runStartedAt||s.generationStartedAt||s.createdAt||Date.now());
    $('client-elapsed').textContent=s.runStartedAt||s.generationStartedAt?formatTime(elapsed):'';
    const count=s.messages.filter(m=>m.role==='tool').length;
    if(!active){$('client-detail').textContent=count?'已返回 '+count+' 项操作结果':'';return;}
    const call=s.tool&&s.messages.flatMap(m=>m.tool_calls||[]).find(c=>c.id===s.tool.id);let target='';try{const a=JSON.parse(call?.function?.arguments||'{}');target=a.path||a.query||a.command||'';}catch{}
    const stageTime=formatTime(Date.now()-(s.tool?.startedAt||s.generationStartedAt||s.runStartedAt||Date.now()));
    if(runtimeCurrent.installing&&s.status==='preparing'){$('client-phase').textContent='初始化 Debian';$('client-detail').textContent=(runtimeCurrent.message||'本机离线解压')+' · '+stageTime;}
    else $('client-detail').textContent=target||('第 '+(s.step||1)+' 轮'+(count?' · 已返回 '+count+' 项操作':'')+' · '+(s.status==='preparing'?'连接工作区':s.tool?'本机执行 '+stageTime:'等待网页回复'));
    $('client-detail').title=target;
  }
  setInterval(()=>{if(!document.hidden&&activePage==='chat'&&cached?.active)updateWorkStatus();},1000);
  async function refreshRuntime(){const revision=++runtimeRevision;const value=await native('runtime.status',{});if(revision===runtimeRevision)runtimeState(value);}
  const diagnostic=document.createElement('button');diagnostic.id='runtime-diagnostic';diagnostic.textContent='复制诊断';$('runtime-test').after(diagnostic);
  click('runtime-diagnostic',async()=>{await refreshRuntime();NativeBridge.uiAction('copy-text',JSON.stringify({text:JSON.stringify({appVersion:'5.0.0',runtime:runtimeCurrent},null,2)}));toast('环境诊断已复制');});
  click('runtime-refresh',refreshRuntime);click('runtime-install',async()=>{try{await native('runtime.ensure',{project:project()});toast('环境校验完成');}finally{await refreshRuntime();}});
  click('runtime-test',async()=>{$('runtime-test').disabled=true;$('runtime-report').hidden=false;$('runtime-report').textContent='正在运行真实工具自检…';try{const r=await native('runtime.test',{project:project()});$('runtime-report').textContent=JSON.stringify(r,null,2);}finally{await refreshRuntime();}});
  document.querySelectorAll('[data-analysis]').forEach(b=>b.addEventListener('click',wrap(async()=>{
    const path=$('analysis-path').value.trim();if(!path||path.startsWith('/')||path.split('/').includes('..'))throw new Error('请填写当前项目中的相对路径');
    const q=shellQuote('/workspace/'+path),commands={jadx:`mkdir -p analysis/java && jadx -d analysis/java ${q}`,apktool:`apktool d -f -o analysis/resources ${q}`,cfr:`mkdir -p analysis/cfr && cfr ${q} --outputdir analysis/cfr`,radare2:`mkdir -p analysis && r2 -q -A -c 'afl; s main; pdg' ${q} > analysis/native.txt`};
    BridgeDashboard.navigate('terminal');if(terminals.get(currentTerm)?.project!==project()){const matching=[...terminals].find(([,t])=>t.project===project()&&t.exitCode===undefined);if(matching)selectTerminal(matching[0]);else await startTerminal();}await native('terminal.input',{id:currentTerm,data:commands[b.dataset.analysis]+'\r'});
  })));
  window.addEventListener('bridge:navigate',event=>{closeOptions();activePage=event.detail;if(activePage==='chat'||activePage==='computer')render(client.snapshot());if(activePage==='files')void loadFiles().catch(e=>toast(e.message));if(activePage==='tools')void refreshRuntime().catch(e=>toast(e.message));if(activePage==='terminal'){selectTerminal(currentTerm);if(!terminals.size)void native('terminal.list',{project:project()}).then(async r=>{for(const s of r.sessions||[])await startTerminal(s.id);}).catch(e=>toast(e.message));}});
  const processView=createProcessView({native,project,openLink:url=>NativeBridge.uiAction('open-link',JSON.stringify({url})),notify:toast});
  const computerView=createComputerView({native,client,notify:toast});
  browserScriptView=installBrowserScripts({native,notify:toast});
  const questionView=agentTools?createQuestionView({tools:agentTools,client,notify:toast}):null;
  const settingsHub=extensions?createSettingsHub({native,providers,client,extensions,notify:toast,closeDrawer}):null;
  workspaceView=enhanceWorkspace({openDrawer,closeDrawer,client,providers,notify:toast,selectSession(id){if(dirty)throw new Error('先保存或关闭文件改动，再切换项目');client.select(id);dir='';file='';$('file-editor').hidden=true;renderFingerprint='';BridgeDashboard.navigate('chat');}});
  composerView=createComposer({reasoning:arg=>modelView?.reasoning(arg),client,native,extensions,attachments:mediaView,notify:toast,navigate:page=>BridgeDashboard.navigate(page),openModel:()=>modelView.open(),openWork:section=>workView?.open(section),newChat:()=>{if(client.snapshot().active)throw new Error('请先停止当前任务。');$('chat-new').click();BridgeDashboard.navigate('chat');}});
  workView=createWorkView({client,providers,notify:toast,closeDrawer});
  window.StudioUI={render,openWork:section=>workView?.open(section),extensionState:value=>settingsHub?.extensionState(value),questionState:value=>questionView?.render(value),platformState,closeDrawer,providerState:()=>{modelView?.render();composerView?.render(client.snapshot());},nativeEvent(event){settingsHub?.event(event);if(event.type==='process'){processView.changed();}else if(event.type==='computer'){computerView.render(event.value);}else if(event.type==='runtime'){runtimeRevision++;runtimeState(event.value);}else if(event.type==='clipboard'){terminals.get(currentTerm)?.term.paste(event.text||'');}else if(event.type==='terminal'){const t=terminals.get(event.id);if(t){if(event.data)t.term.write(Uint8Array.from(atob(event.data),c=>c.charCodeAt(0)));if(event.exitCode!==undefined){t.exitCode=event.exitCode;t.term.writeln('\r\n[进程退出：'+event.exitCode+']');renderTermTabs();}}}else if(event.type==='import'){toast(event.error||'已导入 '+event.path);if(!event.error){void mediaView.imported(event);void loadFiles().catch(()=>{});}}}};
  client.publish();void refreshRuntime().catch(()=>{});
}
