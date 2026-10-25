function object(value){return value&&typeof value==='object'&&!Array.isArray(value);}
function json(raw,label){try{return JSON.parse(raw);}catch{throw new Error(label+'格式有误，请粘贴完整内容');}}
export function parseLaunch(raw){
 const words=[];let current='',quote='',escaped=false,started=false;
 for(const c of String(raw).trim()){
  if(escaped){current+=c;escaped=false;started=true;continue;}
  if(c==='\\'&&quote!=="'"){escaped=true;started=true;continue;}
  if(quote){if(c===quote)quote='';else current+=c;started=true;continue;}
  if(c==='"'||c==="'"){quote=c;started=true;continue;}
  if(/\s/.test(c)){if(started){words.push(current);current='';started=false;}continue;}
  if(/[|&;<>`]/.test(c)||c==='\0')throw new Error('这里只填写启动程序和参数，请移除管道、重定向或多条命令');
  current+=c;started=true;
 }
 if(quote||escaped)throw new Error('启动命令的引号或反斜杠尚未闭合');if(started)words.push(current);
 const env={};while(words.length&&/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0])){const entry=words.shift(),at=entry.indexOf('=');env[entry.slice(0,at)]=entry.slice(at+1);}
 if(!words.length)throw new Error('请填写启动命令，例如 npx -y 服务包名');
 return {command:words[0],args:words.slice(1),...(Object.keys(env).length?{env}:{})};
}
export function parseArguments(raw){if(!raw.trim())return [];const value=raw.trim().startsWith('[')?json(raw,'参数'):raw.split(/\r?\n/).filter(s=>s.trim());if(!Array.isArray(value)||value.some(v=>typeof v!=='string'))throw new Error('参数请每行填写一个，或粘贴字符串数组');return value;}
export function parseEnvironment(raw){
 if(!raw.trim())return {};let value={};if(raw.trim().startsWith('{'))value=json(raw,'环境变量');else for(const line of raw.split(/\r?\n/)){if(!line.trim()||line.trim().startsWith('#'))continue;const text=line.replace(/^\s*export\s+/,''),at=text.indexOf('=');if(at<1)throw new Error('环境变量请按 NAME=value 每行填写一个');let entry=text.slice(at+1);if((entry.startsWith('"')&&entry.endsWith('"'))||(entry.startsWith("'")&&entry.endsWith("'")))entry=entry.slice(1,-1);value[text.slice(0,at).trim()]=entry;}
 if(!object(value)||Object.entries(value).some(([k,v])=>!/^[_A-Za-z][_A-Za-z0-9]{0,79}$/.test(k)||typeof v!=='string'))throw new Error('环境变量名称或内容不正确');return value;
}
export function parseMcpInput(raw){
 const text=String(raw).trim();if(!text)throw new Error('请粘贴 MCP 链接、配置或启动命令');
 if(text.startsWith('{')){const parsed=json(text,'MCP 配置');if(!object(parsed))throw new Error('MCP 配置应为一个对象');const mappings=parsed.mcpServers||parsed.servers||(parsed.mcp?.servers);const entries=mappings?Object.entries(mappings):[['MCP 服务',parsed]];if(!entries.length||entries.length>16)throw new Error('一次可添加 1–16 个 MCP 服务');return entries.map(([name,v])=>{
   if(!object(v))throw new Error('MCP 服务配置不完整');if(v.type==='sse'||v.transport==='sse')throw new Error('此地址使用旧 SSE 协议，请使用服务提供的 Streamable HTTP /mcp 端点');
   if(v.url){const u=new URL(v.url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error('MCP 链接应为 HTTP(S) 服务端点');return {name:v.name||name,type:'http',url:u.href,...(v.headers?{headers:v.headers}:{}),enabled:v.disabled!==true};}
   if(typeof v.command!=='string'||v.args&&!Array.isArray(v.args))throw new Error('本机 MCP 配置需包含启动程序和参数');return {name:v.name||name,type:'stdio',command:v.command,args:v.args||[],...(v.env?{env:v.env}:{}),enabled:v.disabled!==true};
  });}
 if(/^https?:\/\//i.test(text)){const u=new URL(text);if(u.username||u.password||u.hash)throw new Error('MCP 链接不能包含账号或片段');return [{name:u.hostname,type:'http',url:u.href,enabled:true}];}
 const launch=parseLaunch(text);return [{name:launch.args.find(s=>s.startsWith('@'))||launch.command,type:'stdio',...launch,enabled:true}];
}
