// Derived only from the client's public task state, never inferred model thoughts.
const tools = {
  read_file: ['reading', '读取文件'],
  list_files: ['reading', '查看目录'],
  search_files: ['reading', '搜索文件'],
  terminal: ['terminal', '运行命令'],
  process: ['terminal','管理常驻任务'],
  write_file: ['writing', '写入文件'],
  browser:['reading','操作浏览器'],
  app_control:['reading','操控手机 App'],
  web_search:['reading','网页搜索'],
  ask_user:['waiting','等你回答'],
  view_image:['reading','查看图片'],
  update_plan:['thinking','整理计划'],
  report_goal:['reading','核对目标证据'],
  delegate:['thinking','子代理正在工作'],
  team_dispatch:['thinking','团队协作中'],
};

export function companionState(session, active) {
  if (!session) return {pose:'idle', label:'准备就绪', visible:false};
  const status=session.status;
  let pose='idle', label='准备就绪';
  if(active && status==='preparing') {pose='thinking';label='准备工作区';}
  else if(active && status==='compacting') {pose='thinking';label='正在压缩上下文';}
  else if(active && status==='tools') [pose,label]=tools[session.tool?.name]||['thinking','执行工具'];
  else if(active && status==='cancelling') {pose='waiting';label='正在停止';}
  else if(active) {pose='thinking';label='正在生成';}
  else if(status==='completed') {pose='done';label='已完成';}
  else if(status==='failed'||status==='interrupted') {pose='error';label=status==='failed'?'运行遇到问题':'上次运行中断';}
  else if(status==='needs_input'||status==='budget') {pose='waiting';label=status==='budget'?'等待继续':'等你补充';}
  else if(status==='cancelled') {pose='idle';label='已停止';}
  return {pose,label,visible:!!active||status!=='idle'&&!!session.messages?.length};
}
