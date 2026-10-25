import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {uiHarness,readyState,navigateStudio} from './ui-harness.mjs';
const launch=()=>chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
test('unchanged refreshes do not flood native layout, including web page geometry',async t=>{
 const browser=await launch();t.after(()=>browser.close());const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat'});t.after(()=>context.close());
 await page.waitForTimeout(100);const before=await page.evaluate(()=>nativeLayouts.length);
 await page.evaluate(s=>{for(let i=0;i<150;i++){BridgeDashboard.render(s);window.dispatchEvent(new Event('resize'));}},readyState);await page.waitForTimeout(100);
 assert.ok(await page.evaluate(n=>nativeLayouts.length-n<=1,before));await navigateStudio(page,'web');await page.waitForTimeout(300);const web=await page.evaluate(()=>nativeLayouts.length);
 await page.evaluate(s=>{for(let i=0;i<80;i++)BridgeDashboard.render(s);},readyState);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>nativeLayouts.length),web);
});
test('empty conversation controls react while encrypted persistence is still pending',async t=>{
 const browser=await launch();t.after(()=>browser.close());const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',saveDelay:1500});t.after(()=>context.close());
 await page.locator('#chat-new').click();assert.equal(await page.locator('#session-current').textContent(),'新工作区');assert.equal(await page.evaluate(()=>clientSaved.length),0);
 await page.locator('#composer-options').click();await page.locator('#client-thinking').click();assert.equal(await page.locator('#client-thinking').getAttribute('aria-pressed'),'true');
 await page.locator('#session-menu').click();assert.equal(await page.locator('#studio-drawer').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#studio-drawer').isVisible(),false);
 assert.equal(await page.evaluate(()=>clientSaved.length),0);
});
test('long history mounts a page of turns and defers hidden logs until expanded',async t=>{
 const browser=await launch();t.after(()=>browser.close());const messages=[];for(let i=0;i<65;i++){messages.push({role:'user',content:'Question '+i},{role:'assistant',content:'Inspect',tool_calls:[{id:'read-'+i,type:'function',function:{name:'read_file',arguments:'{"path":"hello.py"}'}}]},{role:'tool',tool_call_id:'read-'+i,content:JSON.stringify({ok:true,content:'line\n'.repeat(1000)})},{role:'assistant',content:'Answer '+i});}
 const state={selected:'long',sessions:[{id:'long',project:'p-long',title:'Long',status:'completed',settings:{agent:true},messages}]};const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',clientState:state});t.after(()=>context.close());
 assert.equal(await page.locator('.reply-turn').count(),20);assert.equal(await page.locator('.reply-step-result .reply-code').count(),0);assert.match(await page.locator('.reply-earlier').textContent(),/45 轮/);
 await page.locator('.reply-earlier').click();assert.equal(await page.locator('.reply-turn').count(),40);assert.match(await page.locator('.reply-earlier').textContent(),/25 轮/);
 const first=page.locator('.reply-turn').first();if(!await first.locator('.reply-process').evaluate(n=>n.open))await first.locator('.reply-process>summary').click();await first.locator('.reply-step>summary').click();await page.waitForFunction(()=>document.querySelector('.reply-step-result .reply-code'));assert.equal(await page.locator('.reply-step-result .reply-code').count(),1);assert.equal(await page.locator('.reply-raw .reply-code').count(),0);
});
