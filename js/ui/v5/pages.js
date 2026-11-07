const PAGES={
 files:{title:'项目文件',sub:'工作区文件、搜索与编辑器',headings:['.surface-heading'],actions:[]},
 tools:{title:'工具与环境',sub:'离线运行时、内置工具与反编译',headings:['.surface-heading'],actions:[]},
 accounts:{title:'账号',sub:'ChatGPT 账号与模型授权',headings:['.hub-heading'],actions:['#accounts-refresh']},
 extensions:{title:'扩展',sub:'MCP 服务、插件与技能',headings:['.hub-heading'],actions:['#extensions-refresh']},
 tasks:{title:'任务记录',sub:'请求进度与会话关联',headings:['.page-heading'],actions:[]},
 connect:{title:'外接客户端',sub:'本机网关与配置复制',headings:['.page-heading'],actions:[]},
 web:{title:'DeepSeek 网页',sub:'应用内网页与网页登录',headings:['.surface-heading'],actions:[]},
 computer:{title:'浏览器',sub:'AI 浏览器与本机页面',headings:['.computer-heading'],actions:['#computer-chat','#computer-split','#computer-control']},
};
const legacy=()=>!!window.__studioV5LegacyChat;

export function mountV5Pages(){
 if(legacy())return {render(){}};
 if(!document.body.classList.contains('v5-pages'))document.body.classList.add('v5-pages');
 for(const [name,config]of Object.entries(PAGES)){
  const page=document.getElementById('page-'+name);
  if(!page||page.dataset.v5Mounted)continue;
  page.dataset.v5Mounted='true';
  const heading=[...page.querySelectorAll(':scope>'+config.headings.join(',:scope>'))][0]||page.querySelector(config.headings[0]);
  const actions=[];
  for(const selector of config.actions){const button=page.querySelector(selector);if(button){button.classList.add('v5-head-action');actions.push(button);}}
  const wrap=document.createElement('div');wrap.className='v5-page';wrap.dataset.page=name;
  const head=document.createElement('header');head.className='v5-page-head';
  const title=document.createElement('div');title.className='v5-page-title';
  const h1=document.createElement('h1');h1.textContent=config.title;
  const p=document.createElement('p');p.textContent=config.sub;
  title.append(h1,p);head.append(title);
  if(actions.length){const group=document.createElement('div');group.className='v5-page-actions';group.append(...actions);head.append(group);}
  const body=document.createElement('div');body.className='v5-page-body';
  wrap.append(head,body);
  const keep=new Set([heading,...actions]);
  for(const child of [...page.children]){if(keep.has(child)||child===wrap)continue;child.classList.add('v5-block');body.append(child);}
  if(heading)heading.hidden=true;
  page.append(wrap);
 }
 return {render(){}};
}
