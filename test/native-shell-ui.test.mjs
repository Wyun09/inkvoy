import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {uiHarness,toolbarAction,navigateStudio} from './ui-harness.mjs';
let browser;before(async()=>browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined}));after(()=>browser?.close());
async function fixture(t,options={}){const f=await uiHarness(browser,options.viewport||{width:390,height:844},{studio:true,initialPage:'chat',...options});t.after(()=>f.context.close());return f.page;}

test('phone conversation has a unified composer, two header actions and working access to every workspace',async t=>{
 const page=await fixture(t);assert.equal(await page.locator('.bottom-nav').isVisible(),false);assert.equal(await page.locator('.top-actions>button:visible').count(),2);
 assert.equal(await page.locator('.composer-surface #chat-form').count(),1);assert.equal(await page.locator('.composer-surface .composer-toolbar').count(),1);
 await page.locator('#chat-input').fill('跨页面保留这份草稿');await page.locator('#app-more').click();await page.locator('#app-menu-files').click();await page.locator('#app-menu').waitFor({state:'hidden'});
 assert.equal(await page.locator('#page-files').isVisible(),true);assert.equal(await page.locator('.bottom-nav').isVisible(),true);
 await navigateStudio(page,'chat');assert.equal(await page.locator('#chat-input').inputValue(),'跨页面保留这份草稿');assert.equal(await page.locator('.bottom-nav').isVisible(),false);
 await page.locator('#app-more').click();await page.locator('#app-menu-model').click();assert.equal(await page.locator('#provider-endpoint').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#app-more').evaluate(n=>n===document.activeElement),true);
});

test('more actions retain real theme and command handlers and trap focus while open',async t=>{
 const page=await fixture(t);await page.locator('#app-more').click();assert.equal(await page.locator('.topbar').evaluate(n=>n.inert),true);
 await page.locator('#app-menu-close').focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('#app-menu-help').evaluate(n=>n===document.activeElement),true);
 await page.keyboard.press('Tab');assert.equal(await page.locator('#app-menu-close').evaluate(n=>n===document.activeElement),true);await page.keyboard.press('Escape');await page.locator('#app-menu').waitFor({state:'hidden'});
 await toolbarAction(page,'theme');assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('dark')),true);
 await toolbarAction(page,'command-open');await page.locator('#command-input').fill('模型与 API');await page.keyboard.press('Enter');assert.equal(await page.locator('#provider-endpoint').isVisible(),true);
});

test('menu motion can reverse during dismissal without losing focus or leaving a native overlay blocker',async t=>{
 const page=await fixture(t);await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#app-more').click();await page.locator('#app-menu-close').click();await page.locator('#app-more').click();
 await page.waitForFunction(()=>document.querySelector('#app-more').getAttribute('aria-expanded')==='true'&&document.querySelector('#app-menu').dataset.closing==='false');assert.equal(await page.locator('#app-menu').isVisible(),true);
 await page.keyboard.press('Escape');await page.locator('#app-menu').waitFor({state:'hidden'});assert.equal(await page.locator('.topbar').evaluate(n=>n.inert),false);assert.equal(await page.locator('#app-more').evaluate(n=>n===document.activeElement),true);
});

test('native browser is suspended by the action sheet and returns to the same slot after dismissal',async t=>{
 const page=await fixture(t);await page.evaluate(()=>BridgeDashboard.navigate('computer'));await page.waitForFunction(()=>nativeLayouts.at(-1)?.surface==='computer'&&nativeLayouts.at(-1)?.visible);
 const previous=await page.locator('#computer-slot').boundingBox();await page.locator('#app-more').click();await page.waitForFunction(()=>nativeLayouts.at(-1)?.visible===false);await page.keyboard.press('Escape');await page.locator('#app-menu').waitFor({state:'hidden'});await page.waitForFunction(()=>nativeLayouts.at(-1)?.visible===true);
 const current=await page.locator('#computer-slot').boundingBox();for(const key of ['x','y','width','height'])assert.ok(Math.abs(current[key]-previous[key])<1);
});

test('repeated stream renders do not rewrite unchanged header and shell state',async t=>{
 const page=await fixture(t,{clientState:{selected:'stable',sessions:[{id:'stable',project:'p-stable',title:'稳定的任务',status:'generating',settings:{agent:true},messages:[{role:'user',content:'检查项目'}]}]}});
 const writes=await page.evaluate(async()=>{const nodes=[document.querySelector('.brand'),document.body],records=[];const observer=new MutationObserver(items=>records.push(...items));for(const n of nodes)observer.observe(n,{attributes:true,attributeFilter:['data-task-state','data-has-messages','data-has-title']});for(let i=0;i<100;i++)StudioUI.render({selected:'stable',sessions:[],active:null,draft:{sessionId:'stable',content:'片段 '+i}});await new Promise(r=>requestAnimationFrame(r));observer.disconnect();return records.length;});
 assert.equal(writes,0);
});
