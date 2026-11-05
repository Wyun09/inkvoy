import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {uiHarness} from './ui-harness.mjs';

// Regression guard for the 5.4.0 composer refactor: the secondary controls
// live in the tools popover, and the glass surface used to clip that popover
// so the message list intercepted every click. Each case opens the popover and
// hit-tests every real control at its center point, then performs one action.
let browser;
before(async()=>browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined}));
after(async()=>browser?.close());

const controlIds=['client-agent','client-thinking','client-search','composer-slash','composer-mention','work-open','context-meter','composer-collapse','client-browser'];

for(const width of [390,320]){
 test(`composer tools popover stays visible and clickable at ${width}px`,async t=>{
  const {page,context}=await uiHarness(browser,{width,height:844},{studio:true,initialPage:'chat'});
  t.after(()=>context.close());
  assert.equal(await page.locator('#composer-modes').isHidden(),true);
  await page.locator('#composer-options').click();
  await page.locator('#composer-modes').waitFor({state:'visible'});
  const result=await page.evaluate(ids=>{
   const panel=document.getElementById('composer-modes'),box=panel.getBoundingClientRect();
   return {
    insideViewport:box.left>=0&&box.top>=0&&box.right<=innerWidth&&box.bottom<=innerHeight,
    buttons:ids.map(id=>{
     const node=document.getElementById(id);
     if(!node)return{id,missing:true};
     const button=node.getBoundingClientRect(),x=Math.round(button.x+button.width/2),y=Math.round(button.y+button.height/2),hit=document.elementFromPoint(x,y);
     return{id,visible:node.getClientRects().length>0,hit:!!hit&&(hit===node||node.contains(hit))};
    }),
   };
  },controlIds);
  assert.ok(result.insideViewport,'tools popover must stay inside the viewport');
  for(const button of result.buttons){
   assert.ok(!button.missing,button.id+' is missing');
   assert.ok(button.visible,button.id+' is not rendered');
   assert.ok(button.hit,button.id+' is covered by another layer');
  }
  await page.locator('#client-browser').click();
  await page.locator('#page-computer').waitFor({state:'visible'});
 });
}
