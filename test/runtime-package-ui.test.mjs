import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {uiHarness} from './ui-harness.mjs';

test('a lightweight install offers tool import while preserving chat and enabling initialization after verification',async t=>{
 const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});t.after(()=>browser.close());
 const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'tools',runtimeFixture:{ready:false,installed:false,imageAvailable:false,phase:'idle'}});t.after(()=>context.close());
 await page.waitForFunction(()=>document.getElementById('runtime-state').textContent.includes('轻量版'));
 assert.equal(await page.locator('#runtime-install').isDisabled(),true);assert.equal(await page.locator('#runtime-test').isDisabled(),true);
 await page.locator('#runtime-import').click();await page.locator('#runtime-packages').click();
 assert.deepEqual(await page.evaluate(()=>nativeActions.filter(a=>a.action.startsWith('runtime-')).map(a=>a.action)),['runtime-import','runtime-packages']);
 await page.evaluate(()=>StudioUI.nativeEvent({type:'runtime',value:{ready:false,imageAvailable:false,installing:true,phase:'importing',progress:50,message:'已校验 50%'}}));
 assert.equal(await page.locator('#runtime-import').isDisabled(),true);assert.equal(await page.locator('#runtime-progress').isVisible(),true);
 await page.evaluate(()=>StudioUI.nativeEvent({type:'runtime',value:{ready:false,imageAvailable:true,installing:false,phase:'idle',message:'工具包已校验，可初始化 Debian 环境'}}));
 assert.equal(await page.locator('#runtime-import').isVisible(),false);assert.equal(await page.locator('#runtime-install').isEnabled(),true);
 await page.evaluate(()=>BridgeDashboard.navigate('chat'));await page.locator('#chat-input').fill('聊天无需工具包');assert.equal(await page.locator('#chat-input').inputValue(),'聊天无需工具包');
});
