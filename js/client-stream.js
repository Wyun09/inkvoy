// The local client consumes the same SSE frames as an external OpenAI client.
export function createClientStream() {
  let buffer='',error,finished=false,usage,usageMeta,finishReason;
  const message={role:'assistant',content:''},calls=[];
  function push(text) {
    buffer=(buffer+text).replace(/\r\n/g,'\n');
    let boundary;
    while((boundary=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);
      const data=frame.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
      if(!data||data==='[DONE]')continue;
      const value=JSON.parse(data);if(value.error){error=new Error(value.error.message||'流式回复失败');continue;}
      usage=value.usage||usage;usageMeta=value.usage_meta||usageMeta;
      const choice=value.choices?.[0];if(!choice)continue;const d=choice.delta||{};
      if(d.content)message.content+=d.content;const reasoning=d.reasoning_content??d.reasoning;if(reasoning)message.reasoning_content=(message.reasoning_content||'')+reasoning;
      for(const call of d.tool_calls||[]){const index=call.index??calls.length;if(!Number.isInteger(index)||index<0||index>63)throw new Error('接口返回了不合法的工具序号');const current=calls[index]||(calls[index]={id:'',type:'function',function:{name:'',arguments:''}});if(call.id)current.id=call.id;if(call.function?.name)current.function.name+=call.function.name;if(call.function?.arguments)current.function.arguments+=call.function.arguments;}
      if(choice.finish_reason){finished=true;finishReason=choice.finish_reason;}
    }
  }
  function finish(){if(error)throw error;if(!finished)throw new Error('流式回复提前中断，未执行未确认的工具。');if(calls.length){message.tool_calls=calls;if(!message.content)message.content=null;}return {choices:[{message,finish_reason:finishReason}],usage,usage_meta:usageMeta};}
  return {push,finish,preview:()=>({content:message.content,reasoning:message.reasoning_content||'',phase:'generating'})};
}
