import test from 'node:test';
import assert from 'node:assert/strict';
import {createClientStream} from '../js/client-stream.js';
const frame=value=>'data: '+JSON.stringify(value)+'\n\n';
test('SSE client assembles split frames, usage and validated tool identity',()=>{
 const s=createClientStream(),wire=': keep-alive\n\n'+frame({choices:[{delta:{content:'读'}}]})+frame({choices:[{delta:{content:'取',tool_calls:[{index:0,id:'real-id',function:{name:'read_file',arguments:'{"path":'}}]}}]})+frame({choices:[{delta:{tool_calls:[{index:0,function:{arguments:'"x"}'}}]},finish_reason:'tool_calls'}]})+frame({choices:[],usage_meta:{agent_status:'complete'}})+'data: [DONE]\n\n';
 for(let i=0;i<wire.length;i+=7)s.push(wire.slice(i,i+7));const r=s.finish();assert.equal(r.choices[0].message.content,'读取');assert.equal(r.choices[0].message.tool_calls[0].id,'real-id');assert.deepEqual(JSON.parse(r.choices[0].message.tool_calls[0].function.arguments),{path:'x'});assert.equal(r.usage_meta.agent_status,'complete');
});
test('SSE error and disconnected stream cannot become successful completions',()=>{const s=createClientStream();s.push(frame({error:{message:'Actual web error'}}));assert.throws(()=>s.finish(),/Actual web error/);assert.throws(()=>createClientStream().finish(),/提前中断/);});
