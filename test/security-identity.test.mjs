import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '../js/client.js';

test('actual outgoing requests keep a stable specialist identity while conversation history advances',async()=>{
 const requests=[];const client=createClient({saveState:()=>true,native:async()=>({ok:true}),request:async(id,body)=>{requests.push(body);return {choices:[{message:{role:'assistant',content:'已检查提供的项目。'}}],usage_meta:{agent_status:'complete'}};},cancel:()=>{}});
 await client.send('检查我提供的项目代码');await client.send('继续解释发现');
 assert.equal(requests.length,2);const system=requests[0].messages[0];assert.equal(system.role,'system');assert.equal(system.content,requests[1].messages[0].content);
 for(const pattern of [/Inky/,/Inkvoy/,/cybersecurity/,/authorized penetration testing/,/reverse engineering/,/software development/,/actual evidence/,/not a malware sandbox/])assert.match(system.content,pattern);
 assert.ok(requests[1].messages.some(m=>m.role==='user'&&m.content==='继续解释发现'));assert.equal(client.current().status,'completed');
});
