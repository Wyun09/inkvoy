import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { companionState } from './companion.js';
import { createReplyView } from './replies.js';
import { createChangeView } from './changes.js';
import { createModelSettings } from './model-settings.js';
import {createComputerView} from './computer.js';
import {createQuestionView} from './questions.js';
import {createAttachments} from './attachments.js';

const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shellQuote=s=>"'"+String(s).replaceAll("'","'\\''")+"'";
const labels={idle:'准备开始',generating:'正在生成',tools:'工具执行中',cancelling:'正在停止',completed:'已完成',needs_input:'等待你的补充',cancelled:'已停止',failed:'需要处理',interrupted:'上次运行中断',budget:'已达本轮预算'};
const uiIcon=(path)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
const icons={code:uiIcon('<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>'),spark:uiIcon('<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/>'),search:uiIcon('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'),folder:uiIcon('<path d="M3 7h6l2-3h5l2 3h3v13H3Z"/>'),send:uiIcon('<path d="M12 20V4m-6 6 6-6 6 6"/>'),copy:uiIcon('<rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V4H4v12h4"/>')};
export function initStudio({client,native,providers,agentTools}) {
  const nav=document.querySelector('.bottom-nav'); if(!nav)return;
  const main=document.createElement('div');main.id='studio-pages';
  main.innerHTML=`
  <main class="page studio-chat" id="page-chat" hidden>
    <div class="chat-heading"><button id="session-menu" aria-expanded="false" aria-controls="studio-drawer" aria-label="打开会话与设置侧栏"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h12M4 18h16"/></svg></button><div><strong id="session-current">新会话</strong><small>DeepSeek</small></div><button id="chat-new" aria-label="新建会话">＋</button></div>
    <section id="session-picker" class="session-picker" hidden><div id="client-sessions"></div><div class="session-edit"><input id="session-title" aria-label="会话名称" maxlength="80"><button id="session-rename">命名</button><button id="session-archive">归档</button><button id="session-export">导出</button><button id="session-delete">删除</button></div><p>删除只移除本机聊天记录；项目文件与网页历史保留。</p></section>
    <div id="chat-stage" class="chat-stage is-empty"><div id="chat-messages" class="chat-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
    <section id="client-progress" class="client-progress" hidden><button id="task-companion" class="task-companion" type="button" data-pose="idle" aria-label="小墨：准备就绪，点击展开执行过程"><span class="companion-sprite"></span></button><div><div class="work-status-heading"><strong id="client-phase"></strong><time id="client-elapsed" aria-live="off"></time></div><p id="client-detail"></p><span class="work-activity-line" aria-hidden="true"></span></div><button id="client-stop">停止</button></section>
    <div id="client-notice" class="client-notice" hidden><span></span><button id="client-resume">继续任务</button></div>
    <form id="chat-form" class="chat-composer"><textarea id="chat-input" rows="2" placeholder="回复 DeepSeek…" aria-label="发送给 AI 的消息"></textarea><div class="composer-bottom"><button type="button" id="composer-options" aria-label="对话选项" aria-expanded="false" aria-controls="composer-modes"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16M8 4v6m8 4v6"/></svg></button><div id="composer-modes" class="composer-modes" role="group" aria-label="对话选项" hidden><button type="button" id="client-agent" aria-pressed="true">⌘ Agent</button><button type="button" id="client-thinking" aria-pressed="false">✦ 思考</button><button type="button" id="client-search" aria-pressed="true">◎ 搜索</button></div><span class="composer-model">DeepSeek</span><button id="chat-send" type="submit" aria-label="发送消息">↑</button></div></form>
    </div>
  </main>
  <main class="page studio-files" id="page-files" hidden><div class="studio-title"><div><h1>项目文件</h1></div><button id="file-refresh" class="studio-square" aria-label="刷新文件">↻</button></div>
    <div class="file-actions"><button id="file-import">＋ 导入文件</button><button id="file-new">新文件</button><button data-navigate="tools">工具中心 ↗</button></div><div class="file-breadcrumb"><button id="file-parent" aria-label="上一级目录">↰</button><code id="file-directory">/workspace</code></div><div class="file-search"><input id="file-query" aria-label="搜索项目文件内容" placeholder="在项目中搜索文字"><button id="file-find">搜索</button></div><div id="file-results"></div><div id="file-list" class="file-list"></div>
    <section id="file-editor" hidden><div class="editor-heading"><input id="file-path" aria-label="文件路径" placeholder="src/main.py"><span id="file-dirty"></span></div><textarea id="file-content" spellcheck="false" aria-label="编辑文件内容"></textarea><div class="editor-actions"><button id="file-save">保存文件</button><button id="file-export">导出</button><button id="file-analyze">分析此文件 ↗</button><button id="file-close">关闭</button></div></section><p class="studio-footnote">导入文件会复制到当前项目。环境升级保留项目与分析结果。</p>
  </main>
  <main class="page studio-terminal" id="page-terminal" hidden><div class="terminal-heading"><div><span class="terminal-led"></span><strong>Debian 终端</strong><small id="terminal-state">尚未启动</small></div><button id="terminal-add" aria-label="新建终端">＋</button><button id="terminal-close" aria-label="关闭当前终端">×</button></div><div id="terminal-tabs" class="terminal-tabs"></div><div id="terminal-host" class="terminal-host"><div id="terminal-empty"><span>›_</span><h2>Debian 终端</h2><p>Bash · Python · Node · Git<br>与 AI 共用当前项目</p><button id="terminal-start">启动 Debian</button></div></div><div class="terminal-keys"><button data-key="\u0003">Ctrl C</button><button data-key="\u0004">Ctrl D</button><button data-key="\t">Tab</button><button data-key="\u001b">Esc</button><button data-key="\u001b[A">↑</button><button data-key="\u001b[B">↓</button><button data-key="\u001b[D">←</button><button data-key="\u001b[C">→</button></div><div class="terminal-footer"><span>PRoot / ARM64 · /workspace</span><button id="terminal-copy">复制选中</button><button id="terminal-clear">清屏</button></div></main>
  <main class="page studio-tools" id="page-tools" hidden><div class="studio-title"><div><h1>工具与环境</h1></div><button class="studio-square" id="runtime-refresh" aria-label="刷新工具状态">↻</button></div><section class="runtime-card"><div><span class="runtime-symbol">◈</span><div><h2>Debian ARM64</h2><p id="runtime-state">检查离线运行环境…</p></div></div><progress id="runtime-progress" max="100" value="0" hidden></progress><p id="runtime-detail"></p><div><button id="runtime-install">初始化环境</button><button id="runtime-test">运行自检</button></div></section><div class="tool-intro"><h2>已随镜像收录</h2><p>首次初始化在本机解压，不逐个下载工具。</p></div><div id="runtime-tools" class="tool-grid"></div><section class="tool-target"><label for="analysis-path">项目内的分析目标</label><input id="analysis-path" placeholder="sample.apk"><div><button data-analysis="jadx">Java 源码</button><button data-analysis="apktool">资源 / Smali</button><button data-analysis="cfr">JAR / Class</button><button data-analysis="radare2">ELF / SO 伪代码</button></div><p>结果写入 analysis/。工具会保留错误与不完整恢复信息。</p></section><pre id="runtime-report" hidden></pre><p class="studio-footnote">PRoot 复用 Android 内核；它不是隔离沙箱。运行未知程序前请自行检查。</p></main>`;
  while(main.firstChild)nav.before(main.firstChild);
  nav.innerHTML=`<button data-navigate="chat" class="active" aria-current="page"><span>✦</span><span>对话</span></button><button data-navigate="files"><span>▤</span><span>文件</span></button><button data-navigate="terminal"><span>›_</span><span>终端</span></button><button data-navigate="web"><span data-icon="globe"></span><span>网页</span></button><button data-navigate="home"><span data-icon="grid"></span><span>工作台</span><i id="task-nav-dot" hidden></i></button>`;
  document.querySelector('.brand strong').textContent='DeepSeek Studio';
  document.querySelector('.brand>div>span').textContent='本机工作室';
  const $=id=>document.getElementById(id);const toast=t=>window.BridgeDashboard?.toast(t);
  const wrap=fn=>async event=>{const button=event?.currentTarget?.tagName==='BUTTON'?event.currentTarget:null;const disabled=button?.disabled;if(button){button.disabled=true;button.setAttribute('aria-busy','true');}try{await fn(event);}catch(e){toast(e?.message||'操作失败，请检查环境状态');}finally{if(button){button.disabled=!!disabled;button.removeAttribute('aria-busy');}}};
  const click=(id,fn)=>$(id).addEventListener('click',wrap(fn));
  let changeView,modelView,mediaView,cached,renderFingerprint='',dir='',file='',dirty=false,currentTerm,terminalSerial=0,activePage='chat',runtimeCurrent={},runtimeRevision=0,showArchived=false;const terminals=new Map();
  const scrim=document.createElement('div');scrim.id='studio-drawer-scrim';scrim.hidden=true;
  scrim.innerHTML=`<aside id="studio-drawer" class="studio-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><header><img src="logo.png" width="28" height="28" alt=""><div><strong id="drawer-title">DeepSeek Studio</strong></div><button id="drawer-close" aria-label="关闭侧栏">×</button></header><button id="drawer-new">＋ 新建会话</button><div class="drawer-section-title"><span>最近对话</span><button id="session-pin" aria-label="置顶当前会话">☆</button></div><div id="drawer-sessions"></div><nav class="drawer-shortcuts" aria-label="工作区"><button data-drawer-page="files">${icons.folder} 项目文件</button><button data-drawer-page="terminal">${icons.code} 终端</button><button data-drawer-page="tools">${icons.code} 工具与环境</button><button data-drawer-page="web">${icons.search} DeepSeek 网页</button><button data-drawer-page="home">${icons.code} 工作台</button><button data-drawer-page="connect">${icons.code} API 配置</button></nav><details id="drawer-settings" class="drawer-settings"><summary>设置与权限</summary><button id="drawer-theme">切换明暗主题</button><section class="permission-card"><div><strong>权限与后台运行</strong><span id="permission-summary">正在读取系统状态…</span></div><button data-permission="files"><span>所有文件访问<small>授权后，新建终端可访问 /shared</small></span><b id="permission-files-status">查看设置 ›</b></button><button data-permission="notifications"><span>服务通知<small>显示桥的运行状态和返回入口</small></span><b id="permission-notifications-status">查看设置 ›</b></button><button data-permission="battery"><span>后台运行<small>允许忽略电池优化，减少锁屏中断</small></span><b id="permission-battery-status">查看设置 ›</b></button><button data-permission="app-settings"><span>系统应用设置<small>部分手机还需允许自启动、后台活动</small></span><b>打开 ›</b></button><p>共享存储权限不包含其他应用的私有目录。Android/data 仍受系统限制。</p></section></details><footer id="drawer-service-state">本机桥 · 等待连接</footer></aside>`;
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
  function closeDrawer(){if(mediaView?.close())return true;if(modelView?.close())return true;if(changeView?.close())return true;if(scrim.hidden)return false;scrim.hidden=true;$('session-menu').setAttribute('aria-expanded','false');document.querySelectorAll('.page,.topbar,.bottom-nav').forEach(n=>n.inert=false);drawerFocus?.focus();return true;}
  function openDrawer(event){closeOptions();drawerFocus=event?.currentTarget||document.activeElement;scrim.hidden=false;$('session-menu').setAttribute('aria-expanded','true');document.querySelectorAll('.page,.topbar,.bottom-nav').forEach(n=>n.inert=true);$('drawer-close').focus();}
  click('drawer-close',closeDrawer);click('drawer-new',()=>{if($('chat-new').disabled)return;$('chat-new').click();closeDrawer();});click('drawer-theme',()=>$('theme').click());
  scrim.addEventListener('click',event=>{if(event.target===scrim)closeDrawer();});
  scrim.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeDrawer();}if(event.key==='Tab'){const nodes=[...scrim.querySelectorAll('button:not(:disabled),input:not(:disabled),summary,[tabindex="0"]')].filter(n=>n.getClientRects().length),first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
  scrim.querySelectorAll('[data-drawer-page]').forEach(b=>b.addEventListener('click',()=>{closeDrawer();BridgeDashboard.navigate(b.dataset.drawerPage);}));
  scrim.querySelectorAll('[data-permission]').forEach(b=>b.addEventListener('click',()=>NativeBridge.uiAction('permission-'+b.dataset.permission,'{}')));
  const access=document.createElement('button');access.id='permissions-open';access.className='permissions-entry';access.textContent='权限与后台运行  ↗';$('page-home').querySelector('.page-heading').after(access);click('permissions-open',e=>{openDrawer(e);$('drawer-settings').open=true;$('drawer-settings').scrollIntoView({block:'nearest'});});
  function platformState(state){const p=state.permissions||{};for(const [key,property]of [['files','allFiles'],['notifications','notifications'],['battery','batteryUnrestricted']])$('permission-'+key+'-status').textContent=p[property]===true?'已开启 ✓':p[property]===false?'去开启 ›':'查看设置 ›';$('permission-summary').textContent=p.allFiles&&p.notifications&&p.batteryUnrestricted?'权限已就绪':'按需开启，系统授权后自动更新';$('drawer-service-state').textContent=(state.running?'● 本机桥运行中':'○ 本机桥已停止')+(state.busy?' · 正在处理任务':'')+' · '+(state.version||'2.3.0');}
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
    replyView.render(s,isActive,state.draft);
    changeView.refresh();
    const companion=companionState(s,isActive);
    $('client-progress').hidden=!companion.visible;$('client-progress').classList.toggle('is-finished',!isActive);
    $('task-companion').dataset.pose=companion.pose;$('task-companion').setAttribute('aria-label','小墨：'+companion.label+'，点击展开执行过程');
    $('client-phase').textContent=state.draft&&state.draft.sessionId===s?.id?(state.draft.phase==='searching'?'搜索网页':state.draft.phase==='repairing'?'校验回复格式':state.draft.reasoning&&!state.draft.content?'正在思考':'正在回复'):companion.label;$('client-progress').dataset.active=String(isActive);updateWorkStatus();
    $('client-stop').hidden=!isActive;$('composer-options').disabled=!!state.active;if(state.active)closeOptions();
    $('client-notice').hidden=!(s?.notice||state.storage?.error);$('client-notice').querySelector('span').textContent=s?.notice||state.storage?.error||'';$('client-resume').hidden=isActive||s?.status==='completed';
    $('chat-send').disabled=!!state.active;$('chat-input').disabled=!!state.active;$('chat-new').disabled=!!state.active;
    $('client-stop').disabled=s?.status==='cancelling';
    for(const [id,key]of [['client-agent','agent'],['client-thinking','thinking'],['client-search','search']]){const enabled=s?.settings?.[key]??key!=='thinking';$(id).classList.toggle('selected',enabled);$(id).setAttribute('aria-pressed',String(enabled));$(id).disabled=!!state.active;}
    modelView?.render();
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
  $('chat-form').addEventListener('submit',wrap(async e=>{e.preventDefault();const text=$('chat-input').value;if(!text.trim()&&!mediaView.current().length)return;$('chat-input').value='';await client.send(text,mediaView.take());}));
  $('chat-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){$('chat-form').requestSubmit();e.preventDefault();}});
  click('client-stop',()=>client.stop());click('client-resume',()=>client.resume());

  $('chat-input').addEventListener('input',()=>{$('chat-input').style.height='auto';$('chat-input').style.height=Math.min(160,Math.max(54,$('chat-input').scrollHeight))+'px';});
  for(const [id,key]of [['client-agent','agent'],['client-thinking','thinking'],['client-search','search']])click(id,()=>{const s=client.current()||client.create();client.settings({[key]:!s.settings[key]});});
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
    const term=new Terminal({fontFamily:'ui-monospace, "Noto Sans Mono", monospace',fontSize:13,scrollback:10000,cursorBlink:true,convertEol:false,allowProposedApi:false,theme:{background:'#14231e',foreground:'#deeadc',cursor:'#c3dfa7',selectionBackground:'#4b6c55',black:'#14231e',red:'#ed9e92',green:'#b0d6a1',yellow:'#e9d39f',blue:'#9bbdd9',magenta:'#c3acd3',cyan:'#9dd1c5',white:'#deeadc'}});const fit=new FitAddon();term.loadAddon(fit);term.open(host);try{fit.fit();}catch{}
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
  click('runtime-diagnostic',async()=>{await refreshRuntime();NativeBridge.uiAction('copy-text',JSON.stringify({text:JSON.stringify({appVersion:'2.3.0',runtime:runtimeCurrent},null,2)}));toast('环境诊断已复制');});
  click('runtime-refresh',refreshRuntime);click('runtime-install',async()=>{try{await native('runtime.ensure',{project:project()});toast('环境校验完成');}finally{await refreshRuntime();}});
  click('runtime-test',async()=>{$('runtime-test').disabled=true;$('runtime-report').hidden=false;$('runtime-report').textContent='正在运行真实工具自检…';try{const r=await native('runtime.test',{project:project()});$('runtime-report').textContent=JSON.stringify(r,null,2);}finally{await refreshRuntime();}});
  document.querySelectorAll('[data-analysis]').forEach(b=>b.addEventListener('click',wrap(async()=>{
    const path=$('analysis-path').value.trim();if(!path||path.startsWith('/')||path.split('/').includes('..'))throw new Error('请填写当前项目中的相对路径');
    const q=shellQuote('/workspace/'+path),commands={jadx:`mkdir -p analysis/java && jadx -d analysis/java ${q}`,apktool:`apktool d -f -o analysis/resources ${q}`,cfr:`mkdir -p analysis/cfr && cfr ${q} --outputdir analysis/cfr`,radare2:`mkdir -p analysis && r2 -q -A -c 'afl; s main; pdg' ${q} > analysis/native.txt`};
    BridgeDashboard.navigate('terminal');if(terminals.get(currentTerm)?.project!==project()){const matching=[...terminals].find(([,t])=>t.project===project()&&t.exitCode===undefined);if(matching)selectTerminal(matching[0]);else await startTerminal();}await native('terminal.input',{id:currentTerm,data:commands[b.dataset.analysis]+'\r'});
  })));
  window.addEventListener('bridge:navigate',event=>{closeOptions();activePage=event.detail;if(activePage==='files')void loadFiles().catch(e=>toast(e.message));if(activePage==='tools')void refreshRuntime().catch(e=>toast(e.message));if(activePage==='terminal'){selectTerminal(currentTerm);if(!terminals.size)void native('terminal.list',{project:project()}).then(async r=>{for(const s of r.sessions||[])await startTerminal(s.id);}).catch(e=>toast(e.message));}});
  const computerView=createComputerView({native,client,notify:toast});
  const questionView=agentTools?createQuestionView({tools:agentTools,client,notify:toast}):null;
  window.StudioUI={render,questionState:value=>questionView?.render(value),platformState,closeDrawer,providerState:()=>modelView?.render(),nativeEvent(event){if(event.type==='computer'){computerView.render(event.value);}else if(event.type==='runtime'){runtimeRevision++;runtimeState(event.value);}else if(event.type==='clipboard'){terminals.get(currentTerm)?.term.paste(event.text||'');}else if(event.type==='terminal'){const t=terminals.get(event.id);if(t){if(event.data)t.term.write(Uint8Array.from(atob(event.data),c=>c.charCodeAt(0)));if(event.exitCode!==undefined){t.exitCode=event.exitCode;t.term.writeln('\r\n[进程退出：'+event.exitCode+']');renderTermTabs();}}}else if(event.type==='import'){toast(event.error||'已导入 '+event.path);if(!event.error){void mediaView.imported(event);void loadFiles().catch(()=>{});}}}};
  client.publish();void refreshRuntime().catch(()=>{});
}
