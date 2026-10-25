export async function modelMessages(messages,native){
 const imageRefs=[];for(const message of messages)for(const attachment of message.attachments||[])if(attachment.image&&attachment.id)imageRefs.push(attachment);
 const selected=new Set(imageRefs.slice(-8)),result=[],cache=new Map();
 for(const message of messages){
  const {role,content,tool_calls,tool_call_id,reasoning_content}=message;const wire={role,content,...(tool_calls?{tool_calls}:{}),...(tool_call_id?{tool_call_id}:{}),...(reasoning_content?{reasoning_content}:{})};
  if(message.attachments?.length){const hints=message.attachments.map(a=>'[附件] '+a.name+' · 项目路径 '+a.path+(a.image&&!selected.has(a)?'（早期图片本轮未重传，可使用 view_image 再次查看）':'')).join('\n');const parts=[{type:'text',text:[content,hints].filter(Boolean).join('\n\n')||'请查看附件'}];for(const image of message.attachments)if(selected.has(image)){let data=cache.get(image.id);if(!data){data=await native('media.data',{id:image.id});if(typeof data!=='string'||!data.startsWith('data:image/'))throw new Error('图片附件无法读取，未发送空图片');cache.set(image.id,data);}parts.push({type:'image_url',image_url:{url:data}});}wire.content=parts.length>1?parts:parts[0].text;}
  result.push(wire);
 }
 return result;
}
