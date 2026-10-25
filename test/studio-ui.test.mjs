import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {uiHarness,readyState,navigateStudio} from './ui-harness.mjs';
test('Studio buttons change modes, create sessions, edit and save files, and drive PTY input',async t=>{
 const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});t.after(()=>browser.close());
 const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat'});t.after(()=>context.close());await page.evaluate(s=>BridgeDashboard.render(s),readyState);
 await page.locator('#chat-new').click();await page.locator('#composer-options').click();await page.locator('#client-agent').click();assert.equal(await page.locator('#client-agent').getAttribute('aria-pressed'),'false');await page.locator('#client-thinking').click();assert.equal(await page.locator('#client-thinking').getAttribute('aria-pressed'),'true');
 await page.locator('#session-menu').click();await page.locator('#session-manage summary').click();await page.locator('#session-title').fill('我的分析项目');await page.locator('#session-rename').click();assert.equal(await page.locator('#session-current').textContent(),'我的分析项目');await page.locator('#drawer-close').click();
 await navigateStudio(page,'files');await page.locator('.file-entry').first().click();await page.waitForFunction(()=>!document.querySelector('#file-editor').hidden);assert.equal(await page.locator('#file-content').inputValue(),'print("fixture")\n');await page.locator('#file-content').fill('print("edited")\n');await page.locator('#file-save').click();await page.waitForFunction(()=>document.querySelector('#file-dirty').textContent==='已保存');
 await page.locator('#file-import').click();assert.ok((await page.evaluate(()=>nativeActions)).some(a=>a.action==='import-file'));
 await page.locator('.file-row-export').first().click();assert.ok((await page.evaluate(()=>nativeActions)).some(a=>a.action==='export-file'&&a.payload.path));
 await navigateStudio(page,'terminal');await page.locator('#terminal-start').click();await page.waitForFunction(()=>document.querySelector('#terminal-state').textContent.includes('已连接'));await page.locator('.terminal-keys button').first().click();assert.ok((await page.evaluate(()=>workspaceCalls)).some(c=>c.operation==='terminal.input'&&c.args.data==='\u0003'));
 await page.locator('#terminal-add').click();await page.waitForFunction(()=>document.querySelectorAll('#terminal-tabs button').length===2);await page.locator('#terminal-close').click();await page.waitForFunction(()=>document.querySelectorAll('#terminal-tabs button').length===1);
 await navigateStudio(page,'files');await page.locator('#file-analyze').click();await page.locator('[data-analysis="cfr"]').click();await page.waitForFunction(()=>workspaceCalls.some(c=>c.operation==='terminal.input'&&c.args.data.includes('cfr')));
 assert.ok((await page.evaluate(()=>workspaceCalls)).some(c=>c.operation==='file.write'&&c.args.content.includes('edited')));
 const previousId=(await page.evaluate(()=>workspaceCalls.filter(c=>c.operation==='terminal.open')))[0].args.project;
 await navigateStudio(page,'chat');await page.locator('#chat-new').click();await navigateStudio(page,'files');await page.locator('.file-row-analyze').first().click();await page.locator('[data-analysis="cfr"]').click();
 await page.waitForFunction(previous=>workspaceCalls.some(c=>c.operation==='terminal.open'&&c.args.project!==previous),previousId);
 const opened=await page.evaluate(()=>workspaceCalls.filter(c=>c.operation==='terminal.open'));assert.notEqual(opened.at(-1).args.project,previousId);
});
test('Studio layout fits 320px, exposes controls, and renders model HTML inert',async t=>{
 const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});t.after(()=>browser.close());const clientState={selected:'fixture-session',sessions:[{id:'fixture-session',project:'p-fixture',title:'安全渲染',settings:{agent:false},status:'completed',messages:[{role:'assistant',content:'<img src=x onerror="window.injected=true"><script>window.injected=true</script>\n\n```js\nalert(1)\n```'}]}]};const {page,context}=await uiHarness(browser,{width:320,height:700},{studio:true,initialPage:'chat',clientState});t.after(()=>context.close());
 for(const tab of ['chat','files','terminal','web','home']){await navigateStudio(page,tab);assert.equal(await page.locator('#page-'+tab).isVisible(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await navigateStudio(page,'chat');
 assert.equal(await page.evaluate(()=>window.injected),undefined);assert.equal(await page.locator('#chat-messages script').count(),0);assert.equal(await page.locator('#chat-messages img').count(),0);assert.equal(await page.locator('#chat-messages code').count(),1);
});

test('compact chat sidebar owns sessions and permissions, closes with Escape/back and restores focus',async t=>{
 const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});t.after(()=>browser.close());const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat'});t.after(()=>context.close());
 await page.evaluate(s=>BridgeDashboard.render(s),{...readyState,version:'2.0.2',permissions:{allFiles:false,notifications:true,batteryUnrestricted:false}});
 assert.equal(await page.locator('.topbar').isVisible(),false);assert.ok((await page.locator('.chat-heading').boundingBox()).height<=62);
 assert.equal(await page.locator('.bottom-nav').isVisible(),false);assert.equal(await page.locator('.welcome-suggestions').count(),0);assert.ok((await page.locator('#chat-form').boundingBox()).y<600);
 assert.equal(await page.locator('#studio-drawer-scrim').isVisible(),false);await page.locator('#session-menu').click();assert.equal(await page.locator('#studio-drawer').isVisible(),true);
 assert.equal(await page.locator('#permission-files-status').textContent(),'去开启 ›');assert.equal(await page.locator('#permission-notifications-status').textContent(),'已开启 ✓');
 await page.locator('#drawer-settings summary').click();
 for(const permission of ['files','notifications','battery'])await page.locator('[data-permission="'+permission+'"]').click();
 for(const permission of ['files','notifications','battery'])assert.ok((await page.evaluate(()=>nativeActions)).some(a=>a.action==='permission-'+permission));
 await page.keyboard.press('Escape');assert.equal(await page.locator('#studio-drawer-scrim').isVisible(),false);assert.equal(await page.locator('#session-menu').evaluate(node=>node===document.activeElement),true);
 await page.locator('#session-menu').click();assert.equal(await page.evaluate(()=>BridgeDashboard.back()),true);assert.equal(await page.locator('#page-chat').isVisible(),true);
 await page.locator('#session-menu').click();await page.locator('[data-drawer-page="tools"]').click();assert.equal(await page.locator('#page-tools').isVisible(),true);assert.equal(await page.locator('#studio-drawer-scrim').isVisible(),false);
 await page.evaluate(()=>AndroidEngine.nativeEvent({type:'runtime',value:{ready:false,installing:false,progress:30,message:'过时进度',error:'读取镜像失败：manifest.json',errorCode:'manifest_unavailable'}}));
 assert.equal(await page.locator('#runtime-detail').textContent(),'读取镜像失败：manifest.json');assert.equal(await page.locator('#runtime-install').textContent(),'重试初始化');assert.equal(await page.locator('#runtime-progress').isVisible(),false);
});

test('compact thread has usable touch targets, animated sidebar and no promotional cards',async t=>{
 const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});t.after(()=>browser.close());const {page,context}=await uiHarness(browser,{width:320,height:700},{studio:true,initialPage:'chat'});t.after(()=>context.close());
 await page.emulateMedia({reducedMotion:'no-preference'});
 assert.equal(await page.locator('.chat-welcome h2').textContent(),'有什么可以帮你？');
 const bad=await page.evaluate(()=>[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length).filter(n=>n.getBoundingClientRect().width<43.5||n.getBoundingClientRect().height<43.5).map(n=>n.id));assert.deepEqual(bad,[]);
 await page.locator('#composer-options').click();assert.equal(await page.locator('#composer-modes').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#composer-modes').isVisible(),false);
 await page.locator('#session-menu').click();assert.match(await page.locator('#studio-drawer').evaluate(node=>getComputedStyle(node).animationName),/drawer-slide/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.keyboard.press('Escape');
});

test('pet uses actual pending terminal tool, pauses away from chat, and respects reduced motion',async t=>{
 const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});t.after(()=>browser.close());
 const clientState={selected:'pet',sessions:[{id:'pet',project:'p-pet',title:'终端任务',settings:{agent:true},status:'interrupted',notice:'检查后继续',messages:[{role:'user',content:'inspect'},{role:'assistant',content:'',tool_calls:[{id:'tool-1',type:'function',function:{name:'terminal',arguments:'{"command":"pwd"}'}}]}]}]};
 const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',clientState,holdTools:true});t.after(()=>context.close());
 await page.emulateMedia({reducedMotion:'no-preference'});assert.equal(await page.locator('#task-companion').getAttribute('data-pose'),'error');
 await page.locator('#client-resume').click();await page.waitForFunction(()=>document.querySelector('#task-companion').dataset.pose==='terminal');
 assert.equal(await page.locator('#client-phase').textContent(),'运行命令');assert.match(await page.locator('.companion-sprite').evaluate(n=>getComputedStyle(n).animationName),/pet-type/);
 assert.equal(await page.locator('#client-stop').isVisible(),true);assert.equal(await page.locator('#chat-send').isDisabled(),true);
 const loaded=await page.evaluate(async()=>{const img=new Image();img.src='companion.png';await img.decode();return {width:img.naturalWidth,height:img.naturalHeight};});assert.equal(loaded.width/loaded.height,.5);
 await navigateStudio(page,'files');assert.equal(await page.locator('.companion-sprite').evaluate(n=>getComputedStyle(n).animationPlayState.split(',').every(x=>x.trim()==='paused')),true);
 await navigateStudio(page,'chat');await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.companion-sprite').evaluate(n=>getComputedStyle(n).animationName),'none');
 await page.locator('#client-stop').click();await page.waitForFunction(()=>document.querySelector('#task-companion').dataset.pose==='waiting');assert.equal(await page.locator('#client-phase').textContent(),'正在停止');
});
