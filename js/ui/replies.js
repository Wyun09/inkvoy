import {marked} from 'marked';
import DOMPurify from 'dompurify';
import {highlightCode} from '../background.js';
import {replyTurns,TOOL_LABELS,STATUS_LABELS} from './reply-model.js';
import {attachmentCards} from './attachments.js';
const languages=new Set(['javascript','typescript','python','bash','json','xml','css','java']);

const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
const clock=ms=>ms>=60000?Math.floor(ms/60000)+'分'+Math.floor(ms%60000/1000)+'秒':Math.max(0,ms/1000).toFixed(ms<1000?1:0)+'秒';
export function createReplyView({container,copy,openFile,showChange,openImage=()=>{},openLink=()=>{},notify=()=>{}}){
  let selected,previousUsers=0,startIndex=0,lastSession,lastActive,lastDraft;const nodes=new Map();
  const earlier=el('button','reply-earlier','加载更早的对话');earlier.type='button';
  earlier.onclick=()=>{const anchor=container.querySelector('[data-reply-key]'),oldY=anchor?.getBoundingClientRect().top;const users=(lastSession?.messages||[]).map((m,i)=>m.role==='user'&&!m.internal?i:-1).filter(i=>i>=0&&i<startIndex);startIndex=users.at(-20)??0;render(lastSession,lastActive,lastDraft,true);if(anchor?.isConnected)container.scrollTop+=anchor.getBoundingClientRect().top-oldY;};
  const highlighter=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const figure=entry.target;highlighter.unobserve(figure);const run=async()=>{if(!figure.isConnected||!figure.getClientRects().length)return;const source=figure.source;try{const value=await highlightCode(source,figure.language);const body=figure.querySelector('code');if(body&&figure.isConnected&&figure.source===source)body.innerHTML=DOMPurify.sanitize(value,{ALLOWED_TAGS:['span'],ALLOWED_ATTR:['class']});}catch{/* Plain text remains usable if the worker was interrupted. */}};if(window.requestIdleCallback)requestIdleCallback(run,{timeout:300});else setTimeout(run,0);}},{root:container,rootMargin:'120px'});
  const jump=el('button','reply-jump','回到最新 ↓');jump.type='button';jump.hidden=true;container.after(jump);
  const bottom=()=>{container.scrollTop=container.scrollHeight;jump.hidden=true;};jump.onclick=bottom;
  container.addEventListener('scroll',()=>{jump.hidden=container.scrollHeight-container.scrollTop-container.clientHeight<120;},{passive:true});
  const action=(label,fn,className='')=>{const b=el('button',className,label);b.type='button';let running=false;b.addEventListener('click',async()=>{if(b.disabled||running)return;running=true;b.setAttribute('aria-busy','true');try{await fn(b);}catch(e){notify(e?.message||'操作失败');}finally{running=false;b.removeAttribute('aria-busy');}});return b;};
  function code(text,language='文本',allowWrap=true){
    const figure=el('figure','reply-code'),bar=el('figcaption','reply-code-toolbar'),title=el('span','',language),pre=el('pre'),body=el('code');
    body.textContent=text.length>80000?text.slice(0,80000)+'\n…内容较长，复制可取得完整内容':text;
    const aliases={js:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',py:'python',sh:'bash',shell:'bash',html:'xml',vue:'xml'};const hint=language.split('.').at(-1).toLowerCase(),lang=aliases[hint]||hint;
    if(text.length<=24000&&languages.has(lang)){figure.source=text;figure.language=lang;highlighter.observe(figure);}
    pre.append(body);bar.append(title);
    if(allowWrap){const wrap=action('换行',b=>{const on=!figure.classList.contains('wrap-code');figure.classList.toggle('wrap-code',on);b.setAttribute('aria-pressed',String(on));});wrap.setAttribute('aria-pressed','false');bar.append(wrap);}
    const cp=action('复制',b=>{copy(text);b.textContent='已复制';});cp.setAttribute('aria-label','复制'+language+'内容');bar.append(cp);figure.append(bar,pre);return figure;
  }
  function markdown(node,text){
    node.innerHTML=DOMPurify.sanitize(marked.parse(String(text||''),{async:false}),{ALLOWED_TAGS:['p','br','strong','em','del','ul','ol','li','pre','code','blockquote','table','thead','tbody','tr','th','td','h1','h2','h3','h4','hr','a','input'],ALLOWED_ATTR:['href','title','class','type','checked','disabled'],ALLOW_DATA_ATTR:false});
    node.querySelectorAll('input').forEach(n=>{n.type='checkbox';n.disabled=true;n.setAttribute('aria-label',n.checked?'已完成':'未完成');});
    node.querySelectorAll('[class]').forEach(n=>{if(n.tagName!=='CODE')n.removeAttribute('class');});
    node.querySelectorAll('pre').forEach(pre=>{const c=pre.querySelector('code'),language=(c?.className||'').match(/language-([\w+-]+)/)?.[1]||'代码';pre.replaceWith(code(c?.textContent||pre.textContent,language));});
    node.querySelectorAll('table').forEach(table=>{const scroll=el('div','reply-table');scroll.tabIndex=0;scroll.setAttribute('aria-label','可横向滚动的表格');table.replaceWith(scroll);scroll.append(table);});
    node.querySelectorAll('a').forEach(a=>{const url=a.getAttribute('href');a.removeAttribute('href');if(!url||!/^https?:\/\//i.test(url))return;try{if(!new URL(url).hostname)return;}catch{return;}a.role='link';a.tabIndex=0;a.title=url;a.addEventListener('click',()=>openLink(url));a.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();openLink(url);}});});
  }
  function manualDetails(className,label){const details=el('details',className),summary=el('summary','',label);details.append(summary);summary.addEventListener('click',()=>{details.dataset.manual='true';});return {details,summary};}
  function makeTurn(){
    const root=el('article','chat-message assistant reply-turn'),header=el('header','reply-header'),brand=el('span','reply-brand','DeepSeek'),status=el('span','reply-status');header.append(brand,status);
    const thinking=manualDetails('reply-thinking','思考过程'),thought=el('div','reply-thought');thinking.details.append(thought);
    const process=manualDetails('reply-process','执行过程'),notes=el('div','reply-notes'),steps=el('div','reply-steps');process.details.append(notes,steps);
    const answer=el('div','markdown reply-body'),pending=el('div','reply-pending'),footer=el('footer','reply-footer'),cp=action('复制回复',()=>copy(root.copyText||''),'reply-copy');footer.append(cp);
    root.append(header,thinking.details,process.details,answer,pending,footer);return {root,brand,status,thinking,thought,process,notes,steps,answer,pending,footer,toolNodes:new Map(),messageNodes:new Map()};
  }
  function resultContent(node,tool,project){
    node.replaceChildren();const r=tool.result;
    if(!tool.resultMessage){node.append(el('p','reply-result-empty',tool.status==='running'?'命令和文件操作由本机执行，结果返回后会显示在这里。':tool.status==='queued'?'等待执行':'没有已确认的执行结果'));return;}
    if(!r||typeof r!=='object'){node.append(code(String(tool.resultMessage.content||''),'返回内容'));return;}
    if(r.error)node.append(el('p','reply-error',String(r.error)));
    if(r.attachment)node.append(attachmentCards([r.attachment],{openImage,openFile}));
    if(r.attachments?.length)node.append(attachmentCards(r.attachments,{openImage,openFile}));
    if(tool.call.function?.name==='web_search'){
      if(r.content){const answer=el('div','markdown');markdown(answer,r.content);node.append(answer);}
      if(r.notice)node.append(el('p','reply-result-meta',r.notice));
      const sources=el('div','reply-search-sources');for(const source of r.sources||[])if(/^https?:\/\//i.test(source.url))sources.append(action(source.title||source.url,()=>openLink(source.url)));node.append(sources);
    }
    if(tool.call.function?.name==='ask_user')for(const answer of r.answers||[])node.append(el('p','reply-question-answer',answer.question+'\n'+(answer.skipped?'已跳过':[...(answer.selected||[]),answer.custom].filter(Boolean).join('；'))));
    if(tool.call.function?.name==='process'){
      node.append(el('p','reply-result-meta',r.state==='running'?'常驻任务运行中 · 离开页面后继续':r.state==='stopping'?'常驻任务正在停止':r.state==='exited'?'常驻任务已退出':''));
      if(r.previewUrl&&/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+\//i.test(r.previewUrl))node.append(action('打开预览',()=>openLink(r.previewUrl),'reply-change-open'));
      node.append(action('管理常驻任务',()=>window.BridgeDashboard?.navigate('terminal'),'reply-change-open'));
      for(const job of r.jobs||[])node.append(el('p','reply-result-meta',[job.title,job.state,job.previewUrl].filter(Boolean).join(' · ')));
    }
    if(tool.call.function?.name==='browser'){
      node.append(el('p','reply-browser-meta',[r.title,r.url].filter(Boolean).join(' · ')));
      node.append(action('打开 AI 浏览器',()=>window.BridgeDashboard?.navigate('computer'),'reply-change-open'));
      if(r.screenshot?.url&&/^https:\/\/bridge\.local\/browser-capture\/[a-f0-9-]{36}\.jpg$/.test(r.screenshot.url)){const figure=el('figure','reply-browser-capture'),image=el('img');image.src=r.screenshot.url;image.alt='本次操作后的浏览器截图';image.loading='lazy';figure.append(image);node.append(figure);}
      if(r.text)node.append(el('pre','reply-browser-observation',String(r.text).slice(0,10000)));
    }
    const meta=[];if(Number.isFinite(r.exitCode))meta.push('退出码 '+r.exitCode);if(Number.isFinite(r.durationMs))meta.push(clock(r.durationMs));if(r.truncated)meta.push('输出有截断');if(r.timedOut)meta.push('已超时');if(r.outputIncomplete)meta.push('输出未完全收集');
    if(meta.length)node.append(el('p','reply-result-meta',meta.join(' · ')));
    if(typeof r.stdout==='string'&&r.stdout)node.append(code(r.stdout,'标准输出'));
    if(typeof r.stderr==='string'&&r.stderr){const block=code(r.stderr,'错误输出');block.classList.add('stderr');node.append(block);}
    if(typeof r.content==='string'&&tool.call.function?.name!=='web_search')node.append(code(r.content,tool.args.path||'文件内容'));
    if(Array.isArray(r.entries)){const list=el('ul','reply-file-list');for(const entry of r.entries.slice(0,100)){const li=el('li','',String(entry.name)+(entry.directory?'/':''));list.append(li);}node.append(list);if(r.entries.length>100)node.append(el('p','reply-result-meta','仅展示前 100 项'));if(!r.entries.length)node.append(el('p','reply-result-meta','目录为空'));}
    if(Array.isArray(r.matches)){const list=el('div','reply-matches');for(const hit of r.matches.slice(0,50)){const b=action(String(hit.path)+':'+hit.line,()=>openFile(project,String(hit.path)));b.append(el('span','',String(hit.text||'')));list.append(b);}node.append(list);if(!r.matches.length)node.append(el('p','reply-result-meta','没有找到匹配内容'));}
    if(r.change?.id&&typeof r.change.path==='string'){
      const card=el('div','reply-file-change');card.append(el('span','reply-file-mark','▤'),el('div','reply-file-title',r.change.path));
      card.append(el('small','',r.change.kind==='created'?'新建文件':'文件已修改'));
      card.append(action('查看改动',()=>showChange(project,r.change.id),'reply-change-open'),action('打开文件',()=>openFile(project,r.change.path),'reply-change-file'));node.append(card);
    }else if(tool.call.function?.name==='write_file'&&r.ok!==false)node.append(el('p','reply-result-meta','已写入 '+String(r.path||tool.args.path||'文件')+(Number.isFinite(r.bytes)?' · '+r.bytes+' B':'')));
    const raw=manualDetails('reply-raw','原始结果');raw.details.addEventListener('toggle',()=>{if(raw.details.open&&!raw.loaded){raw.loaded=true;raw.details.append(code(String(tool.resultMessage.content||''),'JSON'));}});node.append(raw.details);
  }
  function updateTurn(v,turn,session){
    v.root.dataset.status=turn.status;v.status.textContent=turn.draft==='partial'?'部分输出 · 未完成':turn.draft==='live'?'正在回复':STATUS_LABELS[turn.status]||'已返回';
    v.brand.textContent=turn.messages.find(m=>m.message.model_label)?.message.model_label||session.modelLabel||'DeepSeek';
    v.root.copyText=turn.final?.message.content||turn.messages.map(m=>m.message.content||'').filter(Boolean).join('\n\n');v.footer.hidden=!v.root.copyText;
    v.thinking.details.hidden=!turn.reasoning;if(v.thought.textContent!==turn.reasoning)v.thought.textContent=turn.reasoning;
    const showProcess=turn.tools.length||turn.notes.length||turn.orphanResults.length;v.process.details.hidden=!showProcess;
    v.process.summary.textContent=turn.tools.length?'执行链 · '+turn.tools.length+' 项操作':'回复过程';
    if(!v.process.details.dataset.manual)v.process.details.open=true;
    v.notes.hidden=true;
    const keep=new Set();for(const tool of turn.tools){keep.add(tool.key);let row=v.toolNodes.get(tool.key);if(!row){const d=manualDetails('reply-step','');const icon=el('span','reply-step-icon'),title=el('span','reply-step-title'),label=el('span'),target=el('small'),status=el('span','reply-step-status'),body=el('div','reply-step-body'),input=el('div','reply-step-input'),result=el('div','reply-step-result');title.append(label,target);d.summary.append(icon,title,status);body.append(input,result);d.details.append(body);row={root:d.details,title,label,target,status,input,result};d.summary.addEventListener('click',()=>{if(!row.root.open)row.populate?.();});row.root.addEventListener('toggle',()=>{if(row.root.open)row.populate?.();});v.toolNodes.set(tool.key,row);v.steps.append(row.root);}
      row.root.dataset.state=tool.status;row.label.textContent=TOOL_LABELS[tool.call.function?.name]||tool.call.function?.name||'工具';
      const target=tool.args.path||tool.args.query||tool.args.command||tool.args.url||tool.args.action||'';row.title.title=target;row.target.hidden=!target;row.target.textContent=target.length>100?target.slice(0,100)+'…':target;
      row.status.textContent={running:'执行中',queued:'等待',completed:'完成',failed:'失败',cancelled:'已停止',returned:'已返回',interrupted:'待确认'}[tool.status];
      row.populate=()=>{const inputSignature=tool.call.function?.arguments;if(row.inputSignature!==inputSignature){row.inputSignature=inputSignature;row.input.replaceChildren();if(['terminal','process'].includes(tool.call.function?.name)&&tool.args.command)row.input.append(code(tool.args.command,'Bash'));else if(tool.args.path)row.input.append(el('p','reply-result-meta','路径：'+tool.args.path));}const resultSignature=tool.resultMessage?.content??tool.status;if(row.resultSignature!==resultSignature){row.resultSignature=resultSignature;resultContent(row.result,tool,session.project);}};
      if(row.root.open)row.populate();
    }
    for(const [key,row]of v.toolNodes)if(!keep.has(key)){row.root.remove();v.toolNodes.delete(key);}
    // Keep commentary beside the tools it actually precedes. Intermediate
    // messages are not merged into a paragraph above all tool calls.
    const ordered=[],messageKeep=new Set();let stage=0;
    for(const wrapped of turn.messages){
      if(wrapped===turn.final)continue;const source=String(wrapped.message.content||'');
      if(source){messageKeep.add(wrapped.key);let note=v.messageNodes.get(wrapped.key);if(!note){const root=el('section','reply-chain-message'),caption=el('small','reply-chain-caption'),preview=el('div','reply-chain-preview'),more=manualDetails('reply-chain-more','展开完整说明'),body=el('div','markdown');root.append(caption,preview,more.details);note={root,caption,preview,more,body};more.summary.addEventListener('click',()=>{if(!more.details.open&&!note.loaded){markdown(body,note.source);more.details.append(body);note.loaded=true;}});v.messageNodes.set(wrapped.key,note);}
        note.caption.textContent='说明 '+(++stage);note.root.dataset.chainKey=wrapped.key;
        if(note.source!==source){note.source=source;note.loaded=false;note.body.remove();note.preview.textContent=source.length>280?source.slice(0,280)+'…':source;note.more.details.hidden=source.length<=280;if(note.more.details.open){markdown(note.body,source);note.more.details.append(note.body);note.loaded=true;}}
        ordered.push(note.root);
      }
      for(let i=0;i<(wrapped.message.tool_calls||[]).length;i++){const key='tool:'+wrapped.key.slice('message:'.length)+':'+i,row=v.toolNodes.get(key);if(row)ordered.push(row.root);}
    }
    for(const [key,note]of v.messageNodes)if(!messageKeep.has(key)){note.root.remove();v.messageNodes.delete(key);}
    let chainCursor=v.steps.firstChild;for(const node of ordered){if(node!==chainCursor)v.steps.insertBefore(node,chainCursor);chainCursor=node.nextSibling;}
    v.root.classList.toggle('has-chain',!!showProcess);v.answer.dataset.chainFinal=String(!!showProcess);
    const final=String(turn.final?.message.content||''),streaming=turn.draft==='live';if(v.answerSource!==final||v.streaming!==streaming){v.answerSource=final;v.streaming=streaming;if(streaming)v.answer.textContent=final;else markdown(v.answer,final);}v.answer.classList.toggle('is-streaming',streaming);v.answer.hidden=!final;
    const unfinished=!turn.live&&['failed','interrupted','cancelled','needs_input','budget'].includes(turn.status);v.pending.hidden=!!final||!turn.live&&!unfinished;v.pending.classList.toggle('is-inactive',unfinished);
    v.pending.textContent=unfinished?(turn.status==='cancelled'?'回答已停止，已完成的操作保留。':turn.status==='needs_input'?'等待补充信息后继续。':'本次回答尚未完成，可查看下方说明后继续。'):turn.status==='tools'?'正在执行本机操作':turn.status==='cancelling'?'正在停止并保存结果':'正在生成回答';
    // Legacy unpaired tool responses remain available without inventing a successful call.
    const orphan=turn.orphanResults.map(m=>m.content).join('\n');if(orphan!==v.orphanText){v.orphanText=orphan;v.orphan?.remove();if(orphan){v.orphan=code(orphan,'历史工具结果');v.steps.append(v.orphan);}}
  }
  function render(session,active,draft,loading=false){
    const same=selected===session?.id,atEnd=container.scrollHeight-container.scrollTop-container.clientHeight<90,oldTop=container.scrollTop;
    const userIndices=(session?.messages||[]).map((m,i)=>m.role==='user'&&!m.internal?i:-1).filter(i=>i>=0);
    if(!same){highlighter.disconnect();nodes.clear();container.replaceChildren();selected=session?.id;previousUsers=0;startIndex=userIndices.at(-20)??0;}
    lastSession=session;lastActive=active;lastDraft=draft;
    const items=replyTurns(session,active,startIndex,draft),users=userIndices.length,newUser=users>previousUsers;previousUsers=users;
    if(!items.length){if(!container.querySelector('.chat-welcome')){container.replaceChildren();const welcome=el('section','chat-welcome'),pet=el('span','welcome-companion');pet.dataset.pose='idle';pet.setAttribute('aria-hidden','true');pet.append(el('span','companion-sprite'));welcome.append(pet,el('h2','','有什么可以帮你？'),el('p','','从一个问题、一段想法，或当前项目开始。'));container.append(welcome);}jump.hidden=true;return;}
    container.querySelector('.chat-welcome')?.remove();if(startIndex>0){container.prepend(earlier);earlier.textContent='加载更早的对话 · '+userIndices.filter(i=>i<startIndex).length+' 轮';}else earlier.remove();const keep=new Set();let cursor=earlier.isConnected?earlier.nextSibling:container.firstChild;
    for(const item of items){keep.add(item.key);let view=nodes.get(item.key);if(!view){view=item.type==='assistant'?makeTurn():{root:el('article','chat-message user'),body:el('div','markdown')};if(item.type==='user')view.root.append(view.body);view.root.dataset.replyKey=item.key;nodes.set(item.key,view);}
      if(item.type==='assistant'){const last=item.messages.at(-1)?.message,lastResult=item.tools.at(-1)?.resultMessage,stamp=[last,lastResult,item.messages.length,item.tools.length,item.status,item.draft,item.reasoning,session.tool?.id];if(!view.stamp||stamp.some((value,i)=>value!==view.stamp[i])){view.stamp=stamp;updateTurn(view,item,session);}}else {if(view.body.textContent!==String(item.message.content||''))view.body.textContent=String(item.message.content||'');const key=JSON.stringify(item.message.attachments||[]);if(view.attachmentKey!==key){view.attachmentKey=key;view.attachments?.remove();if(item.message.attachments?.length){view.attachments=attachmentCards(item.message.attachments,{openImage,openFile});view.root.append(view.attachments);}}}
      if(view.root!==cursor)container.insertBefore(view.root,cursor);cursor=view.root.nextSibling;
    }
    for(const [key,v]of nodes)if(!keep.has(key)){v.root.querySelectorAll('.reply-code').forEach(n=>highlighter.unobserve(n));v.root.remove();nodes.delete(key);}
    if(!loading&&(!same||atEnd||newUser))requestAnimationFrame(bottom);else{container.scrollTop=oldTop;jump.hidden=container.scrollHeight-container.scrollTop-container.clientHeight<120;}
  }
  function revealCurrent(){const view=[...nodes.values()].filter(v=>v.process).at(-1);if(!view||view.process.details.hidden)return;view.process.details.open=!view.process.details.open;view.process.details.dataset.manual='true';view.process.details.scrollIntoView({block:'nearest',behavior:'auto'});}
  return {render,revealCurrent};
}
