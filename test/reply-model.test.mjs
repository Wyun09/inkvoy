import test from 'node:test';
import assert from 'node:assert/strict';
import {replyTurns,diffLines} from '../js/ui/reply-model.js';
const call=(id,name='terminal')=>({id,type:'function',function:{name,arguments:'{"command":"pwd"}'}});
test('all automatic rounds stay in one reply with real matched outcomes',()=>{
 const s={status:'completed',messages:[{role:'user',content:'run'},{role:'assistant',content:'检查',tool_calls:[call('a')]},{role:'tool',tool_call_id:'a',content:'{"ok":false,"exitCode":1,"stderr":"actual error"}'},{role:'user',internal:true,content:'continue'},{role:'assistant',content:'修复',tool_calls:[call('b')]},{role:'tool',tool_call_id:'b',content:'{"ok":true}'},{role:'assistant',content:'完成'}]};
 const turns=replyTurns(s);assert.equal(turns.length,2);assert.equal(turns[1].tools.length,2);assert.deepEqual(turns[1].tools.map(t=>t.status),['failed','completed']);assert.equal(turns[1].final.message.content,'完成');assert.equal(turns[1].notes.length,2);
});
test('pending, running and interrupted are distinct, and no unpaired result fabricates a call',()=>{
 const s={status:'tools',tool:{id:'a'},messages:[{role:'user',content:'run'},{role:'assistant',tool_calls:[call('a'),call('b')]}]};assert.deepEqual(replyTurns(s,true)[1].tools.map(t=>t.status),['running','queued']);assert.deepEqual(replyTurns({...s,status:'interrupted'},false)[1].tools.map(t=>t.status),['interrupted','interrupted']);
 assert.equal(replyTurns({messages:[{role:'tool',tool_call_id:'unknown',content:'raw'}]})[0].orphanResults.length,1);
});
test('initial generating reply key remains stable when the first assistant message commits',()=>{
 const s={status:'generating',messages:[{role:'user',content:'hello'}]},before=replyTurns(s,true).at(-1).key;s.messages.push({role:'assistant',content:'answer'});assert.equal(replyTurns(s,true).at(-1).key,before);
});
test('failure before the first answer retains an incomplete reply without fabricating text',()=>{
 const s={status:'failed',messages:[{role:'user',content:'run'}]},turn=replyTurns(s,false).at(-1);assert.equal(turn.type,'assistant');assert.equal(turn.status,'failed');assert.equal(turn.final,undefined);assert.deepEqual(turn.tools,[]);
});
test('line diff reconstructs exact text for inserts, deletes, empty and repeated lines',()=>{
 for(const [before,after]of [['','a\n'],['a\nb\n','a\nc\n'],['same','same'],['x\nx\ny','x\ny\nx'],['a',''],['','']]){
  const d=diffLines(before,after);assert.equal(d.rows.filter(r=>r.type!=='add').map(r=>r.text).join('\n'),before);assert.equal(d.rows.filter(r=>r.type!=='remove').map(r=>r.text).join('\n'),after);
 }
});
test('large diff is bounded and preserves exact sides',()=>{
 const before=Array.from({length:600},(_,i)=>'old'+i).join('\n'),after=Array.from({length:600},(_,i)=>'new'+i).join('\n'),d=diffLines(before,after);assert.equal(d.coarse,true);assert.equal(d.rows.filter(r=>r.type!=='add').map(r=>r.text).join('\n'),before);assert.equal(d.rows.filter(r=>r.type!=='remove').map(r=>r.text).join('\n'),after);
});
