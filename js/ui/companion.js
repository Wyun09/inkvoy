// Derived only from the client's public task state, never inferred model thoughts.
const tools = {
  read_file: ['reading', '读取文件'],
  list_files: ['reading', '查看目录'],
  search_files: ['reading', '搜索文件'],
  terminal: ['terminal', '运行命令'],
  process: ['terminal','管理常驻任务'],
  write_file: ['writing', '写入文件'],
  browser:['reading','操作浏览器'],
  web_search:['reading','网页搜索'],
  ask_user:['waiting','等你回答'],
  view_image:['reading','查看图片'],
};

export function companionState(session, active) {
  if (!session) return {pose:'idle', label:'准备就绪', visible:false};
  const status=session.status;
  let pose='idle', label='准备就绪';
  if(active && status==='preparing') {pose='thinking';label='准备工作区';}
  else if(active && status==='tools') [pose,label]=tools[session.tool?.name]||['thinking','执行工具'];
  else if(active && status==='cancelling') {pose='waiting';label='正在停止';}
  else if(active) {pose='thinking';label='正在生成';}
  else if(status==='completed') {pose='done';label='已完成';}
  else if(status==='failed'||status==='interrupted') {pose='error';label=status==='failed'?'运行遇到问题':'上次运行中断';}
  else if(status==='needs_input'||status==='budget') {pose='waiting';label=status==='budget'?'等待继续':'等你补充';}
  else if(status==='cancelled') {pose='idle';label='已停止';}
  return {pose,label,visible:!!active||status!=='idle'&&!!session.messages?.length};
}
