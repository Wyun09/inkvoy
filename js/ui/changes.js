import {diffLines} from './reply-model.js';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export function createChangeView({native,openFile,busy,notify}){
  const scrim=el('div','change-scrim');scrim.id='reply-change-dialog';scrim.hidden=true;
  const dialog=el('section','change-dialog');dialog.role='dialog';dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','change-title');
  const header=el('header'),heading=el('div'),title=el('strong','','文件改动');title.id='change-title';const sub=el('span','change-subtitle');heading.append(title,sub);
  const exit=el('button','change-close','×');exit.setAttribute('aria-label','关闭文件对比');header.append(heading,exit);
  const tabs=el('div','change-tabs');tabs.role='tablist';tabs.setAttribute('aria-label','改动视图');const body=el('div','change-body');body.role='tabpanel';body.id='change-panel';body.tabIndex=0;
  const note=el('p','change-note'),footer=el('footer'),revert=el('button','change-revert','撤回此次修改'),open=el('button','change-open-file','打开当前文件');footer.append(revert,open);dialog.append(header,tabs,body,note,footer);scrim.append(dialog);document.getElementById('app').append(scrim);
  let data,project,id,mode='diff',focus,serial=0;
  const pageNodes=()=>document.querySelectorAll('.page,.topbar,.bottom-nav');
  function close(){if(scrim.hidden)return false;serial++;scrim.hidden=true;pageNodes().forEach(n=>n.inert=false);focus?.focus();return true;}
  exit.onclick=close;scrim.onclick=e=>{if(e.target===scrim)close();};
  scrim.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='Tab'){const list=[...dialog.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(n=>n.getClientRects().length),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  for(const [key,label]of [['diff','改动对比'],['before','修改前'],['after','修改后']]){const button=el('button','',label);button.role='tab';button.id='change-tab-'+key;button.dataset.mode=key;button.setAttribute('aria-controls','change-panel');button.onclick=()=>{mode=key;render();};tabs.append(button);}
  tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const list=[...tabs.children],index=list.findIndex(b=>b.dataset.mode===mode),next=e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowLeft'?2:1))%3;list[next].click();list[next].focus();e.preventDefault();});
  function render(){
    if(!data)return;title.textContent=data.path;sub.textContent=(data.existed?'修改文件':'新建文件')+' · '+data.beforeBytes+' → '+data.afterBytes+' B';
    for(const b of tabs.children){const current=b.dataset.mode===mode;b.setAttribute('aria-selected',String(current));b.tabIndex=current?0:-1;}body.setAttribute('aria-labelledby','change-tab-'+mode);body.replaceChildren();
    if(!data.previewable)body.append(el('p','change-unavailable','此快照为二进制或文本超过 256 KiB，暂不展开文本对比。仍可打开当前文件或撤回此次修改。'));
    else if(mode!=='diff'){const pre=el('pre','change-source',data[mode]);body.append(pre);}
    else{const diff=diffLines(data.before,data.after);sub.append(el('b','diff-count','  +'+diff.added+' −'+diff.removed));let displayed=0;
      for(let i=0;i<diff.rows.length&&displayed<800;i++){
        if(diff.rows[i].type==='same'){let end=i;while(end<diff.rows.length&&diff.rows[end].type==='same')end++;if(end-i>10){for(const row of diff.rows.slice(i,i+3))rowNode(row);body.append(el('div','diff-fold','⋯ '+(end-i-6)+' 行未改动'));i=end-4;continue;}}
        rowNode(diff.rows[i]);
      }
      function rowNode(row){displayed++;const line=el('div','diff-line '+row.type);line.append(el('span','diff-old',String(row.old)),el('span','diff-new',String(row.new)),el('span','diff-sign',row.type==='add'?'+':row.type==='remove'?'−':' '),el('code','',row.text||' '));body.append(line);}
      if(displayed>=800)body.append(el('p','change-unavailable','对比最多展示 800 行，可切换修改前/后查看完整快照预览。'));
    }
    revert.disabled=!data.canRevert||busy();revert.textContent=data.reverted?'已撤回':'撤回此次修改';open.disabled=data.reverted&&!data.existed;
    note.textContent=data.reverted?'此次修改已撤回。':!data.canRevert?'当前文件有后续变化，保留当前内容；此快照不可直接撤回。':busy()?'任务仍在执行，完成或停止后可撤回。':(data.existed?'撤回前会校验当前文件。':'撤回新建会移除此文件，操作前会校验内容。')+'仅记录文件工具/编辑器写入；每项目保留最近 64 次、约 64 MiB。';
  }
  revert.onclick=async()=>{if(!data?.canRevert||busy())return;revert.disabled=true;try{await native('file.revert',{project,id});data=await native('file.change',{project,id});render();notify('已撤回此次文件修改');}catch(e){notify(e.message);try{data=await native('file.change',{project,id});render();}catch{revert.disabled=true;}}};
  open.onclick=async()=>{const target=data?.path;if(!target)return;close();try{await openFile(project,target);}catch(e){notify(e.message);}};
  async function show(p,r){project=p;id=r;mode='diff';data=null;const request=++serial;focus=document.activeElement;scrim.hidden=false;pageNodes().forEach(n=>n.inert=true);title.textContent='读取文件改动…';sub.textContent='';body.replaceChildren();note.textContent='';revert.disabled=true;open.disabled=true;exit.focus();
    try{const value=await native('file.change',{project:p,id:r});if(request!==serial)return;data=value;render();}catch(e){if(request!==serial)return;body.append(el('p','reply-error',e.message));}
  }
  function refresh(){if(data&&!scrim.hidden){revert.disabled=!data.canRevert||busy();if(busy())note.textContent='任务仍在执行，完成或停止后可撤回。';}}
  return {show,close,refresh};
}
