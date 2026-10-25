import {chromium} from 'playwright';
import {uiHarness} from '../test/ui-harness.mjs';
import {replyFixture,fileChanges} from '../test/reply-fixtures.mjs';
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
const output=new URL('../preview/',import.meta.url),shot=async(page,name)=>page.screenshot({animations:'disabled',path:new URL(name+'.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
try{
 const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',clientState:replyFixture,fileChanges});
 await page.locator('#chat-messages').evaluate(n=>n.scrollTop=0);await shot(page,'reply-220-answer');
 await page.locator('.reply-process').evaluate(n=>n.open=true);await page.locator('.reply-step').nth(1).locator('summary').first().click();await page.locator('.reply-process').scrollIntoViewIfNeeded();await shot(page,'reply-220-process');
 await page.locator('.reply-step').nth(2).locator('summary').first().click();await page.locator('.reply-change-open').click();await page.waitForFunction(()=>document.querySelector('.diff-line.add'));await shot(page,'reply-220-diff');await page.locator('.change-close').click();
 await page.locator('.reply-process').evaluate(n=>n.open=true);await page.evaluate(()=>BridgeDashboard.setTheme('dark'));await page.locator('#chat-messages').evaluate(n=>n.scrollTop=0);await shot(page,'reply-220-dark');
 await page.setViewportSize({width:320,height:700});await page.locator('.reply-table').scrollIntoViewIfNeeded();await shot(page,'reply-220-320');await context.close();
 console.log('Captured 5 reply framework previews from production assets; all results are explicit test fixtures.');
}finally{await browser.close();}
