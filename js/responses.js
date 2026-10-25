import {requestEffort} from './reasoning.js';
export function toResponses(body,profile){
 const input=[];for(const message of body.messages||[]){
  if(message.role==='tool'){input.push({type:'function_call_output',call_id:message.tool_call_id,output:message.content||''});continue;}
  if(message.role==='assistant'&&Array.isArray(message.response_items)){let call=0;for(const item of message.response_items){if(item.type==='function_call'){const tool=message.tool_calls?.[call++];if(tool)input.push({type:'function_call',call_id:tool.id,name:tool.function.name,arguments:tool.function.arguments});}else if(['reasoning','message'].includes(item.type))input.push(item);}continue;}
  const parts=typeof message.content==='string'?[{type:'input_text',text:message.content}]:Array.isArray(message.content)?message.content.map(p=>p.type==='image_url'?{type:'input_image',image_url:p.image_url.url,detail:p.image_url.detail||'auto'}:{type:'input_text',text:p.text||''}):[];
  if(parts.length)input.push({role:message.role,content:parts});
  for(const call of message.tool_calls||[])input.push({type:'function_call',call_id:call.id,name:call.function.name,arguments:call.function.arguments});
 }
 return {model:profile.model,input,store:false,stream:true,include:['reasoning.encrypted_content'],...(Number.isInteger(body.max_tokens)&&body.max_tokens>0?{max_output_tokens:body.max_tokens}:{}),...(body.tools?.length?{tools:body.tools.map(t=>({type:'function',name:t.function.name,description:t.function.description,parameters:t.function.parameters,strict:false}))}:{}),...(requestEffort(profile,body.reasoning_effort)?{reasoning:{effort:requestEffort(profile,body.reasoning_effort),summary:'auto'}}:{})};
}
export function createResponsesStream(){
 let buffer='',content='',reasoning='',error,response,done=false,started=false;const items=[];
 function accept(value){if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('OpenAI 返回的回复格式无效');if(value.error){error=new Error([value.error.code,value.error.message||'OpenAI 请求失败'].filter(Boolean).join('：'));throw error;}if(value.status!=='completed'){error=new Error(value.status==='incomplete'?'OpenAI 回复未完成：'+(value.incomplete_details?.reason||'unknown'):'OpenAI 未确认回复完成');throw error;}response=value;done=true;}
 function event(value){
  if(value.type==='response.output_text.delta')content+=value.delta||'';
  else if(value.type==='response.reasoning_summary_text.delta')reasoning+=value.delta||'';
  else if(value.type==='response.output_item.done')items[value.output_index]=value.item;
  else if(value.type==='response.completed')accept(value.response);
  else if(value.type==='error'||value.type==='response.failed'||value.type==='response.incomplete'){const detail=value.error||value.response?.error||value.response?.incomplete_details||{};error=new Error([detail.code||value.code,detail.message||value.message||detail.reason||'OpenAI 回复未完成'].filter(Boolean).join('：'));}
 }
 function push(text){if(!started&&text){text=text.replace(/^\uFEFF/,'');started=true;}buffer=(buffer+text).replace(/\r\n/g,'\n');if(buffer.length>8388608)throw new Error('Responses 流式缓冲超过限制');let boundary;while((boundary=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);const data=frame.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).replace(/^ /,'')).join('\n');if(data&&data!=='[DONE]'){let value;try{value=JSON.parse(data);}catch{throw new Error('OpenAI 返回了无效的流式事件，未执行未确认工具');}event(value);}}if(error)throw error;}
 function finish(){if(error)throw error;if(!done)throw new Error('OpenAI 流在 response.completed 之前中断，未执行未确认工具');const output=response.output||items.filter(Boolean),calls=output.filter(x=>x.type==='function_call').map(x=>({id:x.call_id,type:'function',function:{name:x.name,arguments:x.arguments}}));const finalText=output.filter(x=>x.type==='message').flatMap(x=>x.content||[]).map(x=>x.text||x.refusal||'').join('');const usage=response.usage||{};return {id:response.id,model:response.model,choices:[{finish_reason:calls.length?'tool_calls':'stop',message:{role:'assistant',content:finalText||content||null,...(reasoning?{reasoning_content:reasoning}:{}),...(calls.length?{tool_calls:calls}:{}),response_items:output}}],usage:{prompt_tokens:usage.input_tokens,completion_tokens:usage.output_tokens,total_tokens:usage.total_tokens,prompt_tokens_details:usage.input_tokens_details,completion_tokens_details:usage.output_tokens_details}};}
 return {push,accept,finish,preview:()=>({content,reasoning,phase:'generating'}),get done(){return done;}};
}
