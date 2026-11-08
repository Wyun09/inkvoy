import {marked} from 'marked';
import DOMPurify from 'dompurify';
import {replyTurns,TOOL_LABELS} from '../reply-model.js';

const SPRITE=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
<symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="i-arrow-up" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></symbol>
<symbol id="i-chevron-right" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></symbol>
<symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/></symbol>
<symbol id="i-terminal" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="m8 10 2.6 2L8 14m4.6 0H16"/></symbol>
<symbol id="i-file" viewBox="0 0 24 24"><path d="M7 4.5h6.5L18 9v10.5H7z"/><path d="M13.5 4.5V9H18"/></symbol>
<symbol id="i-code" viewBox="0 0 24 24"><path d="m9 8-4 4 4 4M15 8l4 4-4 4"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4.4l2.8 1.6"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></symbol>
<symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 6 .4l2.2-2.2a4 4 0 0 0-5.7-5.7L11 8"/><path d="M14 10a4 4 0 0 0-6-.4L5.8 11.8a4 4 0 0 0 5.7 5.7L13 16"/></symbol>
<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M4.5 12h15M12 4c2.3 2.4 2.3 13 0 16M12 4c-2.3 2.4-2.3 13 0 16"/></symbol>
<symbol id="i-folder" viewBox="0 0 24 24"><path d="M4 8a2.5 2.5 0 0 1 2.5-2.5h3.6l2 2.5h5.4A2.5 2.5 0 0 1 20 10.5v6a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 4.5 19 7v5.2c0 3.6-2.9 6.4-7 7.3-4.1-.9-7-3.7-7-7.3V7z"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="i-command" viewBox="0 0 24 24"><circle cx="9" cy="9" r="2.6"/><path d="M11.6 9H20M9 11.6V20M9 7v-2a2 2 0 1 0-2 2h2z"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M5 8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-5l-4 3v-3a3 3 0 0 1-2-3z"/></symbol>
</defs></svg>`;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const esc=value=>String(value??'');
const codeText=value=>{if(value==null)return'';if(typeof value==='string')return value;try{return JSON.stringify(value,null,2);}catch{return String(value);}};
const sanitize=html=>DOMPurify.sanitize(html,{ALLOWED_TAGS:['p','br','strong','em','del','ul','ol','li','pre','code','blockquote','table','thead','tbody','tr','th','td','h1','h2','h3','h4','hr','a'],ALLOWED_ATTR:['href','title','class','type','checked','disabled']});
const markdown=text=>sanitize(marked.parse(String(text||''),{async:false}));
const time=ms=>{if(!Number.isFinite(ms))return'';const d=new Date(ms);return d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});};
const duration=ms=>ms>=60000?Math.floor(ms/60000)+'分'+Math.floor(ms%60000/1000)+'秒':Math.max(0,Math.round(ms/1000))+'秒';
const STATE={running:'运行中',queued:'等待',completed:'完成',returned:'完成',failed:'失败',cancelled:'已停止',interrupted:'待确认'};

function icon(id,cls='ic'){return `<svg class="${cls}"><use href="#${id}"/></svg>`;}

function toolIcon(name){return ['terminal','process'].includes(name)?'i-terminal':name==='write_file'||name==='read_file'||name==='search_files'?'i-file':name==='browser'?'i-globe':name==='web_search'?'i-search':'i-command';}

function renderCodeBlock(label,text){
  if(!text)return'';
  const body=esc(text).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  return `<div class="v5-code"><div class="v5-code-head">${icon('i-code')}<span class="v5-code-name">${esc(label)}</span><span class="grow"></span><button class="v5-ibtn v5-copy" data-copy="${esc(text).length?encodeURIComponent(text):''}" aria-label="复制">${icon('i-copy','ic sm')}</button></div><pre>${body}</pre></div>`;
}

function renderToolRow(tool){
  const name=tool.call?.function?.name||'工具';
  const args=tool.args||{};
  const arg=args.path||args.command||args.query||args.url||args.action||args.task||'';
  const status=STATE[tool.status]||tool.status||'';
  const running=tool.status==='running'?`<span class="v5-st run">${icon('i-clock','ic sm')}${status}</span>`:`<span class="v5-st">${status}</span>`;
  const meta=arg?`<span class="v5-arow-arg">${esc(String(arg).slice(0,120))}</span>`:'';
  const body=renderToolBody(tool);
  return `<details class="v5-arow" data-state="${esc(tool.status)}"><summary>${icon(toolIcon(name),'ic')}<span class="v5-arow-main"><span class="v5-arow-name">${esc(TOOL_LABELS[name]||name)}</span>${meta}</span>${running}<span class="v5-chev">${icon('i-chevron-right','ic sm')}</span></summary><div class="v5-arow-body">${body}</div></details>`;
}

function renderToolBody(tool){
  const r=tool.result;
  const out=[];
  if(tool.call?.function?.name==='terminal'&&tool.args?.command)out.push(renderCodeBlock('bash',String(tool.args.command)));
  if(r&&typeof r==='object'){
    if(typeof r.stdout==='string'&&r.stdout)out.push(renderCodeBlock('stdout',r.stdout));
    if(typeof r.stderr==='string'&&r.stderr)out.push(renderCodeBlock('stderr',r.stderr));
    if(Array.isArray(r.entries))out.push(`<div class="v5-filelist">${r.entries.slice(0,20).map(e=>`<span>${esc(e.name||e)}${e.directory?'/':''}</span>`).join('')}</div>`);
    if(r.plan?.steps?.length)out.push(`<div class="v5-plan">${r.plan.steps.map(s=>`<div class="v5-plan-step" data-state="${esc(s.status)}"><span class="v5-dot"></span>${esc(s.title)}</div>`).join('')}</div>`);
    const meta=[];if(Number.isFinite(r.exitCode))meta.push('退出码 '+r.exitCode);if(Number.isFinite(r.durationMs))meta.push(duration(r.durationMs));if(r.truncated)meta.push('输出有截断');
    if(meta.length)out.push(`<div class="v5-meta">${esc(meta.join(' · '))}</div>`);
  }
  if(!out.length&&tool.resultMessage)out.push(renderCodeBlock('结果',codeText(tool.resultMessage.content).slice(0,12000)));
  return out.join('')||`<p class="v5-muted">${tool.status==='running'?'正在执行…':'没有可展示的结果'}</p>`;
}

function renderAssistant(turn){
  const messages=turn.messages||[];
  const final=turn.final?.message?.content||'';
  const reasoning=turn.reasoning||'';
  const notes=turn.notes||[];
  const tools=turn.tools||[];
  const statusText=turn.live?'运行中':turn.status==='failed'?'失败':turn.status==='interrupted'?'待确认':turn.status==='completed'?'已完成':'';
  const finished=turn.messages.find(m=>m.message?.createdAt)?.message?.createdAt||turn.final?.message?.createdAt;
  const meta=finished?`<div class="v5-turn-meta"><span>${time(finished)}</span></div>`:'';
  const reason=reasoning?`<details class="v5-reason"><summary>${icon('i-chevron-right','ic sm')}思考过程</summary><div class="v5-reason-body">${esc(reasoning)}</div></details>`:'';
  const notesHtml=notes.map(n=>`<p class="v5-prose">${esc(String(n.message.content||''))}</p>`).join('');
  const body=final?`<div class="v5-prose markdown">${markdown(final)}</div>`:'';
  const activity=tools.length?`<div class="v5-activity"><button class="v5-activity-sum" aria-expanded="false">${icon('i-terminal','ic')}<span>${tools.length} 个工具</span><span class="v5-activity-cnt">${tools.filter(t=>['completed','returned'].includes(t.status)).length} 完成${tools.some(t=>t.status==='running')?' · '+tools.filter(t=>t.status==='running').length+' 运行':''}</span><span class="grow"></span>${icon('i-chevron-right','ic sm chev')}</button><div class="v5-activity-list" hidden>${tools.map(renderToolRow).join('')}</div></div>`:'';
  const pending=turn.live&&!final?`<div class="v5-pending"><span class="v5-dot run"></span>${statusText||'正在生成回答'}</div>`:'';
  return `<article class="v5-turn assistant">${meta}${reason}${notesHtml}${body}${activity}${pending}</article>`;
}

function renderThread(items,empty){
  if(empty)return `<section class="v5-empty"><div class="v5-empty-title">开始一项新任务</div><div class="v5-empty-sub">代码、安全研究与逆向分析</div><div class="v5-starters"><button data-starter="shield">${icon('i-shield')}<span>安全审计</span></button><button data-starter="globe">${icon('i-globe')}<span>渗透测试</span></button><button data-starter="folder">${icon('i-folder')}<span>逆向分析</span></button><button data-starter="terminal">${icon('i-terminal')}<span>编程与构建</span></button></div></section>`;
  return items.map(item=>item.type==='user'?`<article class="v5-turn user">${time(item.message.createdAt)?`<div class="v5-turn-meta"><span>${time(item.message.createdAt)}</span></div>`:''}<div class="v5-bubble">${esc(item.message.content||'')}</div></article>`:renderAssistant(item)).join('');
}

export function mountV5Chat({client}){
  if(window.__studioV5LegacyChat)return {render(){}};
  try{if(localStorage.getItem('studio-v5-legacy-chat')==='1')return {render(){}};}catch{}
  const page=document.getElementById('page-chat');
  if(!page)return {render(){}};
  document.body.classList.add('v5-chat');
  const legacy=page.querySelector('.chat-stage');
  if(legacy)legacy.hidden=true;
  document.body.insertAdjacentHTML('beforeend',SPRITE);
  const host=el('div','v5-chat');host.id='v5-chat';
  host.innerHTML=`
    <div class="v5-chat-head">
      <div class="v5-chat-title"><div class="v5-title" id="v5-title">新会话</div><div class="v5-sub"><span class="v5-led" id="v5-led"></span><span id="v5-sub">准备就绪</span></div></div>
      <button class="v5-ibtn" id="v5-more" aria-label="更多">${icon('i-more')}</button>
    </div>
    <div class="v5-scroll" id="v5-scroll"><div class="v5-thread" id="v5-thread"></div></div>
    <div class="v5-composer-wrap"><div class="v5-composer-box">
      <textarea class="v5-input" id="v5-input" rows="1" placeholder=""></textarea>
      <div class="v5-composer-bar">
        <button class="v5-ibtn" id="v5-plus" aria-label="添加附件">${icon('i-plus')}</button>
        <button class="v5-ibtn" id="v5-options" aria-label="执行模式">${icon('i-sliders')}</button>
        <button class="v5-ibtn" id="v5-reference" aria-label="引用文件">${icon('i-link')}</button>
        <span class="grow"></span>
        <button class="v5-send" id="v5-send" aria-label="发送">${icon('i-arrow-up')}</button>
      </div>
    </div></div>`;
  page.append(host);
  const thread=host.querySelector('#v5-thread'),scroll=host.querySelector('#v5-scroll'),input=host.querySelector('#v5-input'),send=host.querySelector('#v5-send'),titleEl=host.querySelector('#v5-title'),subEl=host.querySelector('#v5-sub');
  // Move the engine's option panel and suggestion popup out of the hidden
  // legacy composer so the 5.5 composer can keep every tool reachable.
  const modes=document.getElementById('composer-modes');
  if(modes){modes.classList.add('v5-sheet','v5-modes-sheet');document.body.append(modes);}
  const suggestions=document.getElementById('composer-suggestions');
  if(suggestions){suggestions.classList.add('v5-sheet','v5-suggest-sheet');document.body.append(suggestions);}
  const refs=document.querySelector('.composer-references');
  if(refs){refs.classList.add('v5-refs');host.querySelector('.v5-composer-box').prepend(refs);}
  let syncing=false;
  const legacyInput=document.getElementById('chat-input'),legacySend=document.getElementById('chat-send');
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,140)+'px';if(legacyInput){syncing=true;legacyInput.value=input.value;legacyInput.dispatchEvent(new Event('input',{bubbles:true}));syncing=false;}});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();void submit();}});
  async function submit(){if(send.disabled)return;if(legacyInput)legacyInput.value=input.value;legacySend?.click();input.value='';input.style.height='auto';}
  send.addEventListener('click',()=>void submit());
  host.querySelector('#v5-plus').addEventListener('click',()=>document.getElementById('composer-import')?.click());
  host.querySelector('#v5-options').addEventListener('click',()=>document.getElementById('composer-options')?.click());
  host.querySelector('#v5-reference').addEventListener('click',()=>document.getElementById('composer-mention')?.click());
  host.querySelector('#v5-more').addEventListener('click',()=>document.getElementById('app-more')?.click());
  if(legacyInput)legacyInput.addEventListener('input',()=>{if(syncing)return;if(legacyInput.value!==input.value){syncing=true;input.value=legacyInput.value;input.dispatchEvent(new Event('input',{bubbles:true}));syncing=false;}});
  document.addEventListener('pointerdown',()=>{const panel=document.getElementById('composer-modes');if(panel&&!panel.hidden&&!document.querySelector('.v5-composer-box')?.contains(document.activeElement)){/* handled below */}},{passive:true});
  document.addEventListener('pointerdown',event=>{const panel=document.getElementById('composer-modes');if(panel&&!panel.hidden&&!panel.contains(event.target)&&!event.target.closest('#v5-options,#composer-options')){document.getElementById('composer-options')?.click();}},{passive:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){const panel=document.getElementById('composer-modes');if(panel&&!panel.hidden)document.getElementById('composer-options')?.click();}});

  thread.addEventListener('click',event=>{
    const copy=event.target.closest('[data-copy]');if(copy){const text=decodeURIComponent(copy.dataset.copy||'');try{navigator.clipboard?.writeText(text);}catch{}copy.classList.add('done');setTimeout(()=>copy.classList.remove('done'),900);return;}
    const sum=event.target.closest('.v5-activity-sum');if(sum){const list=sum.parentElement.querySelector('.v5-activity-list');const open=sum.getAttribute('aria-expanded')==='true';sum.setAttribute('aria-expanded',String(!open));list.hidden=open;return;}
  });
  let fingerprint='',lastTitle='',previousTurnCount=0;
  function render(){
    const state=client.snapshot(),session=client.current();
    const items=replyTurns(session,!!state.active,0,state.draft,state.toolOutput);
    const empty=!items.length;
    const fp=JSON.stringify([session?.id,session?.title,session?.status,!!state.active,JSON.stringify(state.draft?.content||''),JSON.stringify(state.draft?.reasoning||''),items.length,items.at(-1)?.tools?.length||0,items.at(-1)?.messages?.length||0,items.at(-1)?.draft?.content||'',session?.messages?.length||0]);
    if(session?.title&&session.title!==lastTitle){lastTitle=session.title;titleEl.textContent=session.title;}
    const active=!!state.active;
    send.disabled=active;send.classList.toggle('busy',active);
    const status=session?.status||'idle';
    const labels={idle:'准备就绪',generating:'正在生成',tools:'正在执行工具',completed:'已完成',failed:'运行遇到问题',interrupted:'已中断',needs_input:'等待补充',cancelling:'正在停止',cancelled:'已停止',budget:'等待继续'};
    const toolCount=items.at(-1)?.tools?.length||0;
    subEl.textContent=(labels[status]||'准备就绪')+(toolCount?' · '+toolCount+' 个工具':'');
    host.querySelector('#v5-led').dataset.state=active?'run':status;
    if(fp!==fingerprint){fingerprint=fp;const nearBottom=scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<120;thread.innerHTML=renderThread(items,empty);const turnNodes=thread.querySelectorAll(':scope>.v5-turn');if(items.length>previousTurnCount&&turnNodes.length)turnNodes[turnNodes.length-1].classList.add('new');previousTurnCount=items.length;if(nearBottom||items.at(-1)?.live)scroll.scrollTop=scroll.scrollHeight;}
  }
  render();
  const timer=setInterval(render,220);
  return {render,stop(){clearInterval(timer);}};
}
