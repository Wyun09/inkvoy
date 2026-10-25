export const TOOL_LABELS={terminal:'运行命令',process:'常驻任务',read_file:'读取文件',write_file:'修改文件',list_files:'查看目录',search_files:'搜索文件',view_image:'查看图片',browser:'操作浏览器',web_search:'网页搜索',ask_user:'问答交互'};
export const STATUS_LABELS={idle:'准备就绪',preparing:'准备工作区',generating:'正在生成',tools:'正在执行',cancelling:'正在停止',completed:'已完成',needs_input:'等你补充',budget:'等待继续',failed:'运行遇到问题',interrupted:'运行中断',cancelled:'已停止'};
export function parseJSON(value){try{return JSON.parse(value);}catch{return null;}}
const parsed=new WeakMap();
function cachedJSON(owner,source){const previous=parsed.get(owner);if(previous?.source===source)return previous.value;const value=parseJSON(source);parsed.set(owner,{source,value});return value;}
export function replyTurns(session,active=false,startIndex=0,draft){
  const items=[];let turn=null;
  const ensure=(index)=>turn||(turn={key:'turn:'+index,type:'assistant',messages:[],tools:[],orphanResults:[]},items.push(turn),turn);
  const messages=session?.messages||[];
  for(let index=startIndex;index<messages.length;index++){const m=messages[index];
    if(m.internal)continue;
    if(m.role==='user'){items.push({key:'user:'+index,type:'user',message:m});turn=null;continue;}
    if(m.role==='assistant'){const t=ensure(index);t.messages.push({key:'message:'+index,message:m});for(const [i,call]of (m.tool_calls||[]).entries())t.tools.push({key:'tool:'+index+':'+i,call,args:cachedJSON(call,call.function?.arguments)||{}});}
    else if(m.role==='tool'){const t=ensure(index),tool=t.tools.find(s=>s.call.id===m.tool_call_id&&!s.resultMessage);if(tool){tool.resultMessage=m;tool.result=cachedJSON(m,m.content);}else t.orphanResults.push(m);}
  }
  // The same turn key is used when its first committed assistant message arrives.
  if((active||['failed','interrupted','cancelled','needs_input','budget'].includes(session?.status))&&items.at(-1)?.type==='user')ensure((session?.messages||[]).length);
  const preview=active&&draft?.sessionId===session?.id?draft:!active?session?.partial:null;
  if(preview&&(preview.content||preview.reasoning)){const t=ensure(messages.length);t.draft=active?'live':'partial';t.messages.push({key:'draft',message:{role:'assistant',content:preview.content||'',reasoning_content:preview.reasoning||'',model_label:session.modelLabel}});}
  const last=items.filter(i=>i.type==='assistant').at(-1);
  for(const item of items){if(item.type!=='assistant')continue;item.live=active&&item===last;item.status=item===last?(session?.status||'idle'):'completed';
    for(const tool of item.tools){tool.status=tool.resultMessage?(tool.result?.cancelled?'cancelled':tool.result?.ok===false||Number.isFinite(tool.result?.exitCode)&&tool.result.exitCode!==0?'failed':tool.result?.ok===true?'completed':'returned'):item.live&&session?.tool?.id===tool.call.id?'running':item.live?'queued':'interrupted';}
    item.final=item.messages.at(-1);if(item.final?.message.tool_calls?.length)item.final=null;
    item.notes=item.messages.filter(m=>m!==item.final&&m.message.content);
    item.reasoning=item.messages.filter(m=>m.message.reasoning_content).map(m=>String(m.message.reasoning_content)).join('\n\n');
  }
  return items;
}

// Bounded line LCS for readable text edits; a coarse replacement is used for large inputs.
// Both variants always reconstruct the exact original and replacement, including empty files.
export function diffLines(before,after,maxCells=240000){
  const split=s=>s===''?[]:String(s).split('\n');const a=split(before),b=split(after);let rows=[];
  if(a.length*b.length>maxCells){let head=0,tail=0;while(head<a.length&&head<b.length&&a[head]===b[head])head++;while(tail<a.length-head&&tail<b.length-head&&a[a.length-1-tail]===b[b.length-1-tail])tail++;
    rows=[...a.slice(0,head).map(text=>({type:'same',text})),...a.slice(head,a.length-tail).map(text=>({type:'remove',text})),...b.slice(head,b.length-tail).map(text=>({type:'add',text})),...a.slice(a.length-tail).map(text=>({type:'same',text}))];
  }else{
    const width=b.length+1,dp=new Uint16Array((a.length+1)*width);
    for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i*width+j]=a[i]===b[j]?dp[(i+1)*width+j+1]+1:Math.max(dp[(i+1)*width+j],dp[i*width+j+1]);
    let i=0,j=0;while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){rows.push({type:'same',text:a[i++]});j++;}else if(j<b.length&&(i===a.length||dp[i*width+j+1]>dp[(i+1)*width+j]))rows.push({type:'add',text:b[j++]});else rows.push({type:'remove',text:a[i++]});}
  }
  let oldLine=0,newLine=0;for(const row of rows){row.old=row.type==='add'?'':++oldLine;row.new=row.type==='remove'?'':++newLine;}
  return {rows,added:rows.filter(r=>r.type==='add').length,removed:rows.filter(r=>r.type==='remove').length,coarse:a.length*b.length>maxCells};
}
