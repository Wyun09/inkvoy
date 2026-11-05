import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {uiHarness} from './ui-harness.mjs';
let browser;before(async()=>browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined}));after(()=>browser?.close());
async function setup(t,viewport={width:390,height:844}){const f=await uiHarness(browser,viewport,{studio:true,initialPage:'chat'});t.after(()=>f.context.close());await f.page.evaluate(()=>document.body.classList.add('reduce-motion'));return f.page;}
const box=locator=>locator.boundingBox();
function contained(r,width,height,message){assert.ok(r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=height+1,message+' '+JSON.stringify(r));}

test('a portrait keyboard keeps phone navigation, draft and send control in the visual viewport',async t=>{
 const page=await setup(t);await page.locator('#chat-input').fill('保留输入草稿');await page.setViewportSize({width:390,height:344});await page.waitForFunction(()=>document.body.dataset.keyboard==='true');
 assert.equal(await page.locator('body').getAttribute('data-layout'),'phone');assert.equal(await page.locator('.workspace-rail').isVisible(),false);assert.equal(await page.locator('.bottom-nav').isVisible(),false);
 contained(await box(page.locator('#chat-input')),390,344,'input');contained(await box(page.locator('#chat-send')),390,344,'send');assert.equal(await page.locator('#chat-input').inputValue(),'保留输入草稿');
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.body.dataset.keyboard==='false');assert.equal(await page.locator('.bottom-nav').isVisible(),false);assert.equal(await page.locator('#chat-input').inputValue(),'保留输入草稿');await page.evaluate(()=>BridgeDashboard.navigate('files'));assert.equal(await page.locator('.bottom-nav').isVisible(),true);
});

test('all supported content scales preserve a usable dock and a bounded API dialog',async t=>{
 const page=await setup(t);for(const percent of [30,40,50,60,70,80,90,100,110]){
  await page.evaluate(n=>document.documentElement.style.setProperty('--ui-scale',n/100),percent);await page.waitForFunction(n=>StudioViewport.snapshot().scale===n/100,percent);
  const app=await box(page.locator('#app'));contained(app,390,844,'app at '+percent);await page.evaluate(()=>BridgeDashboard.navigate('files'));const dock=await box(page.locator('.bottom-nav'));assert.ok(dock.height>=47,'dock collapsed at '+percent);await page.evaluate(()=>BridgeDashboard.navigate('chat'));
  await page.locator('#model-picker').click();contained(await box(page.locator('.model-dialog')),390,844,'dialog at '+percent);await page.locator('#provider-endpoint').fill('https://example.test/v1');await page.locator('#provider-model').fill('model-with-a-long-descriptive-name');await page.locator('#provider-save').scrollIntoViewIfNeeded();contained(await box(page.locator('#provider-save')),390,844,'save at '+percent);await page.keyboard.press('Escape');
 }
});

test('native browser slot follows split-pane geometry when the keyboard changes aspect ratio',async t=>{
 const page=await setup(t);await page.evaluate(()=>BridgeDashboard.navigate('computer'));await page.locator('#computer-split').click();await page.locator('#chat-input').fill('继续这个网页任务');
 await page.setViewportSize({width:390,height:410});await page.waitForFunction(()=>document.body.dataset.keyboard==='true');await page.waitForFunction(()=>nativeLayouts.at(-1)?.visible&&nativeLayouts.at(-1).surface==='computer');
 assert.equal(await page.locator('#computer-divider').getAttribute('aria-orientation'),'horizontal');
 const slot=await box(page.locator('#computer-slot')),input=await box(page.locator('#chat-input'));contained(slot,390,410,'native slot');contained(input,390,410,'split input');assert.ok(slot.y+slot.height<=input.y,'browser covered the input');
 const native=await page.evaluate(()=>nativeLayouts.at(-1));assert.ok(Math.abs(native.left-slot.x)<1&&Math.abs(native.top-slot.y)<1&&Math.abs(native.height-slot.height)<1,'native coordinates must match rendered slot');
});

test('rotation and narrow screens keep the same composer without a horizontal page spill',async t=>{
 const page=await setup(t);await page.locator('#chat-input').fill('跨方向的草稿');for(const viewport of [{width:844,height:390},{width:320,height:740},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.waitForFunction(w=>StudioViewport.snapshot().width===w,viewport.width);assert.equal(await page.locator('#chat-input').inputValue(),'跨方向的草稿');
  for(const id of ['#chat-input','#chat-send','#model-picker'])contained(await box(page.locator(id)),viewport.width,viewport.height,id);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 }
});
