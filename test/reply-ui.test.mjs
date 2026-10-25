import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {uiHarness} from './ui-harness.mjs';
import {replyFixture,fileChanges,revisionId} from './reply-fixtures.mjs';
const expandProcess=async page=>{const d=page.locator('.reply-process').first();if(!await d.evaluate(n=>n.open))await d.locator('summary').first().click();};
const browserFor=()=>chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
test('failure before any answer keeps an incomplete response and retry notice',async t=>{
 const browser=await browserFor();t.after(()=>browser.close());const state={selected:'early-failure',sessions:[{id:'early-failure',project:'p-failure',status:'failed',notice:'网页连接中断',messages:[{role:'user',content:'开始工作'}]}]};const {page,context}=await uiHarness(browser,{width:320,height:700},{studio:true,initialPage:'chat',clientState:state});t.after(()=>context.close());
 assert.equal(await page.locator('.reply-turn').getAttribute('data-status'),'failed');assert.match(await page.locator('.reply-pending').textContent(),/尚未完成/);assert.equal(await page.locator('.reply-pending').getAttribute('class'),'reply-pending is-inactive');assert.equal(await page.locator('#client-resume').isVisible(),true);
});

test('one response groups tool results, renders rich code/table, and copies exact code',async t=>{
 const browser=await browserFor();t.after(()=>browser.close());const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',clientState:replyFixture,fileChanges});t.after(()=>context.close());
 assert.equal(await page.locator('.reply-turn').count(),1);assert.equal(await page.locator('.reply-step').count(),3);assert.equal(await page.locator('.reply-process').getAttribute('open'),'');
 await page.locator('.reply-thinking summary').click();assert.match(await page.locator('.reply-thought').textContent(),/测试夹具/);
 await page.waitForFunction(()=>document.querySelector('.reply-body .hljs-keyword'));assert.ok(await page.locator('.reply-body .hljs-keyword').count()>0);assert.equal(await page.locator('.reply-table').count(),1);
 const code=page.locator('.reply-body .reply-code');await code.getByRole('button',{name:'换行',exact:true}).click();assert.equal(await code.getAttribute('class'),'reply-code wrap-code');
 await code.getByRole('button',{name:'复制typescript内容',exact:true}).click();const copied=(await page.evaluate(()=>nativeActions.filter(a=>a.action==='copy-text'))).at(-1).payload.text;assert.equal(copied,'const result = {\n  status: "completed",\n  files: ["hello.py"]\n};\n');
 await page.locator('.reply-body [role="link"]').click();assert.equal((await page.evaluate(()=>nativeActions)).at(-1).action,'open-link');
 await expandProcess(page);await page.locator('.reply-step').nth(1).locator('summary').first().click();assert.match(await page.locator('.reply-step').nth(1).textContent(),/退出码 0/);assert.match(await page.locator('.reply-step').nth(1).textContent(),/42 modules/);
});

test('keyed replies keep expanded tools and code DOM while state changes, and preserve reading position',async t=>{
 const browser=await browserFor();t.after(()=>browser.close());const state=structuredClone(replyFixture);state.sessions[0].status='interrupted';state.sessions[0].notice='检查后继续';state.sessions[0].messages.splice(3);state.sessions[0].messages[1].content='已读取配置，继续执行。\n'.repeat(60);
 const {page,context}=await uiHarness(browser,{width:320,height:700},{studio:true,holdTools:true,initialPage:'chat',clientState:state});t.after(()=>context.close());
 await expandProcess(page);await page.locator('.reply-step').first().locator('summary').first().click();await page.evaluate(()=>{window.retainedCode=document.querySelector('.reply-step .reply-code');window.retainedTurn=document.querySelector('.reply-turn');});
 await page.locator('#client-resume').click();await page.waitForFunction(()=>document.querySelector('.reply-step[data-state="running"]'));
 assert.equal(await page.evaluate(()=>window.retainedCode===document.querySelector('.reply-step .reply-code')&&window.retainedTurn===document.querySelector('.reply-turn')),true);assert.equal(await page.locator('.reply-step').first().getAttribute('open'),'');
 await page.locator('#chat-messages').evaluate(n=>n.scrollTop=0);assert.ok(await page.locator('#chat-messages').evaluate(n=>n.scrollHeight-n.clientHeight>200));
 await page.evaluate(()=>{const pending=workspaceCalls.find(c=>c.operation==='tool.execute'&&c.args.name==='terminal');AndroidEngine.workspaceRpc(pending.id,{ok:true,value:{ok:true,stdout:'command done',exitCode:0}});});
 await page.waitForFunction(()=>document.querySelector('.reply-step[data-state="running"] .reply-step-title').textContent.includes('修改文件'));assert.equal(await page.locator('#chat-messages').evaluate(n=>n.scrollTop),0);assert.equal(await page.locator('.reply-jump').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
});

test('file diff opens real snapshot contract, reverts via native operation, and closes with back/focus',async t=>{
 const browser=await browserFor();t.after(()=>browser.close());const {page,context}=await uiHarness(browser,{width:320,height:700},{studio:true,initialPage:'chat',clientState:replyFixture,fileChanges});t.after(()=>context.close());
 await expandProcess(page);await page.locator('.reply-step').nth(2).locator('summary').first().click();await page.locator('.reply-change-open').click();await page.waitForFunction(()=>document.querySelector('.diff-line.add'));
 assert.equal(await page.locator('#change-title').textContent(),'hello.py');assert.match(await page.locator('.diff-line.remove').textContent(),/fixture/);assert.match(await page.locator('.diff-line.add').textContent(),/edited/);
 await page.locator('#change-tab-before').click();assert.equal(await page.locator('.change-source').textContent(),'print("fixture")\n');await page.locator('#change-tab-after').click();assert.equal(await page.locator('.change-source').textContent(),'print("edited")\n');
 await page.locator('.change-revert').click();await page.waitForFunction(()=>document.querySelector('.change-revert').textContent==='已撤回');assert.ok((await page.evaluate(()=>workspaceCalls)).some(c=>c.operation==='file.revert'&&c.args.id===revisionId));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await page.evaluate(()=>BridgeDashboard.back()),true);assert.equal(await page.locator('#reply-change-dialog').isVisible(),false);assert.equal(await page.locator('.reply-change-open').evaluate(n=>n===document.activeElement),true);
});

test('failed commands keep stderr visible in their own result and changed files cannot be reverted',async t=>{
 const browser=await browserFor();t.after(()=>browser.close());const state=structuredClone(replyFixture);state.sessions[0].messages[3].content=JSON.stringify({ok:false,stderr:'actual build error <script>window.injected=true</script>',stdout:'',exitCode:1});const changed=structuredClone(fileChanges);changed[revisionId].current='a later user edit';
 const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',clientState:state,fileChanges:changed});t.after(()=>context.close());
 await expandProcess(page);assert.equal(await page.locator('.reply-step[data-state="failed"]').count(),1);await page.locator('.reply-step').nth(1).locator('summary').first().click();assert.match(await page.locator('.stderr').textContent(),/actual build error/);assert.equal(await page.evaluate(()=>window.injected),undefined);
 await page.locator('.reply-step').nth(2).locator('summary').first().click();await page.locator('.reply-change-open').click();await page.waitForFunction(()=>document.querySelector('.diff-line.add'));assert.equal(await page.locator('.change-revert').isDisabled(),true);assert.match(await page.locator('.change-note').textContent(),/后续变化/);
});
