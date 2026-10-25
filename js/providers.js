import Ajv from 'ajv';
import {LOCAL_TOOLS} from './client.js';
import {randomUUID} from './platform.js';
import {createClientStream} from './client-stream.js';
import {setTimeout,clearTimeout} from './native-clock.js';
export function normalizeEndpoint(value,models=false){
 const u=new URL(String(value).trim());if(!['http:','https:'].includes(u.protocol)||!u.hostname||u.username||u.password||u.hash||u.href.length>4096)throw new Error('请输入完整的 HTTP(S) API 地址');
 let path=u.pathname.replace(/\/+$/,'');if(!path)path='/v1';if(path.endsWith('/chat/completions'))path=path.slice(0,-17);u.pathname=path+(models?'/models':'/chat/completions');return u.href;
}
export function validateProfile(value){const p={id:String(value.id||randomUUID()),name:String(value.name||'自定义 API').trim().slice(0,50),endpoint:String(value.endpoint||'').trim(),model:String(value.model||'').trim(),key:String(value.key||'').trim(),reasoning:!!value.reasoning};normalizeEndpoint(p.endpoint);if(!p.model||p.model.length>160)throw new Error('请填写模型 ID');if(p.key.length>4096||/[\r\n]/.test(p.key))throw new Error('API 密钥格式不正确');return p;}
let validators;
export function validateProviderCompletion(response,requestId){
 const message=response?.choices?.[0]?.message;if(!message||message.role!=='assistant'||message.content!=null&&typeof message.content!=='string')throw new Error('接口没有返回有效的 assistant 消息');
 if(response.choices[0].finish_reason==='length'&&message.tool_calls?.length)throw new Error('工具参数被模型输出上限截断，未执行工具');
 if(message.tool_calls){if(!Array.isArray(message.tool_calls)||message.tool_calls.length>32)throw new Error('接口返回的工具调用数量不正确');if(!validators){const ajv=new Ajv({strict:false,allErrors:true});validators=new Map(LOCAL_TOOLS.map(t=>[t.function.name,ajv.compile(t.function.parameters)]));}
  const ids=new Set();for(const [index,call]of message.tool_calls.entries()){let args;try{args=JSON.parse(call.function?.arguments);}catch{throw new Error('接口返回的工具参数不是完整 JSON');}const check=validators.get(call.function?.name);if(!call.id||ids.has(call.id)||call.type!=='function'||!check||!check(args))throw new Error('接口返回了无效工具或参数，未执行本机操作');ids.add(call.id);call.id=requestId+'-tool-'+index;}
 }
 if(!message.content&&!message.tool_calls?.length)throw new Error('接口返回了空回答');const hit=response.usage?.prompt_cache_hit_tokens??response.usage?.prompt_tokens_details?.cached_tokens;response.usage_meta={source:'custom_api',usage:response.usage||null,cache:{status:Number.isFinite(hit)?hit>0?'hit':'miss':'unknown',tokens_reported:Number.isFinite(hit),...(Number.isFinite(hit)?{hit_tokens:hit}:{})}};return response;
}
export function createProviders({native=globalThis.NativeBridge,save,initial={},onChange=()=>{}}){
 let profiles=[];for(const p of (Array.isArray(initial.profiles)?initial.profiles:[]).slice(0,8))try{profiles.push(validateProfile(p));}catch{}
 let selected=profiles.some(p=>p.id===initial.selected)?initial.selected:'web',saving=Promise.resolve();const pending=new Map();
 const current=()=>profiles.find(p=>p.id===selected);
 const snapshot=()=>({selected,profiles:profiles.map(({key,...p})=>({...p,hasKey:!!key}))});
 const commit=async(next,choice)=>{const raw=JSON.stringify({version:1,selected:choice,profiles:next});const work=saving.catch(()=>{}).then(async()=>{if(await save(raw)===false)throw new Error('模型配置无法加密保存，请检查本机存储');profiles=next;selected=choice;onChange(snapshot());});saving=work;return work;};
 async function upsert(value){const p=validateProfile(value);const next=profiles.filter(item=>item.id!==p.id);if(next.length>=8)throw new Error('最多保存 8 个自定义接口');next.push(p);await commit(next,p.id);return p.id;}
 async function select(id){if(id!=='web'&&!profiles.some(p=>p.id===id))throw new Error('此接口配置已不存在');await commit(profiles,id);}
 async function remove(id){await commit(profiles.filter(p=>p.id!==id),selected===id?'web':selected);}
 function start(id,profile,body,onProgress,operation='chat'){
  return new Promise((resolve,reject)=>{if(!native?.providerRequest){reject(new Error('请更新应用后使用自定义接口'));return;}const stream=createClientStream(),timer=setTimeout(()=>{pending.delete(id);native.providerCancel?.(id);reject(new Error('自定义接口请求超时'));},600000);const redact=text=>{let value=String(text||'接口请求失败');if(profile.key)value=value.split(profile.key).join('[已隐藏]');return value.replace(/Bearer\s+[^\s"']+/gi,'Bearer [已隐藏]').slice(0,500);};pending.set(id,{resolve,reject,stream,timer,onProgress,operation,redact});
   native.providerRequest(id,JSON.stringify({endpoint:normalizeEndpoint(profile.endpoint),key:profile.key,operation,body}));
  });
 }
 function request(id,body,onProgress,profile=current()){if(!profile)throw new Error('请先选择自定义接口');const payload={model:profile.model,messages:body.messages,stream:true,stream_options:{include_usage:true},...(body.tools?{tools:body.tools}:{}),...(profile.reasoning?{reasoning_effort:body.reasoning_effort==='high'?'high':'none'}:{})};return start(id,profile,payload,onProgress).then(result=>validateProviderCompletion(result,id));}
 function models(profile){normalizeEndpoint(profile.endpoint);if(/[\r\n]/.test(profile.key||''))throw new Error('API 密钥格式不正确');return start('models-'+randomUUID(),profile,{},null,'models').then(r=>{const data=r?.data;if(!Array.isArray(data))throw new Error('接口未提供标准模型列表，可手动填写模型 ID');return data.filter(m=>typeof m?.id==='string').map(m=>m.id).slice(0,300);});}
 function event(id,value){const p=pending.get(id);if(!p)return;try{if(value.type==='data'){p.stream.push(value.text);p.onProgress?.(p.stream.preview());return;}if(value.type==='error')throw new Error(value.message||'自定义接口请求失败');if(value.type!=='end'&&value.type!=='response')return;const result=value.type==='response'?value.body:p.stream.finish();if(result?.error)throw new Error(result.error.message||'接口返回错误');clearTimeout(p.timer);pending.delete(id);p.resolve(result);}catch(error){clearTimeout(p.timer);pending.delete(id);native.providerCancel?.(id);p.reject(new Error(p.redact(error?.message||error)));}}
 function cancel(id){const p=pending.get(id);if(!p)return false;native.providerCancel?.(id);clearTimeout(p.timer);pending.delete(id);p.reject(new Error('请求已停止'));return true;}
 return {snapshot,current,upsert,select,remove,request,models,event,cancel,profile:id=>{const p=profiles.find(p=>p.id===id);return p?{...p}:null;}};
}
