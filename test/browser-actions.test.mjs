import test from 'node:test';import assert from 'node:assert/strict';import {chromium} from 'playwright';
import {OBSERVE_SCRIPT} from '../js/browser-observation.js';import {ACTION_SCRIPT} from '../js/browser-actions.js';
async function fixture(t,html){const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:390,height:640}});await page.setContent('<meta name="viewport" content="width=device-width"><style>body{margin:15px}input,button,textarea,[contenteditable]{font:16px system-ui;padding:12px;margin:5px;min-height:20px;box-sizing:border-box}</style>'+html);const first=await page.evaluate(OBSERVE_SCRIPT);const act=args=>page.evaluate(({source,args})=>(0,eval)(source)(args),{source:ACTION_SCRIPT,args});return {page,first,act};}
test('DOM editing bypasses framework value trackers, emits input, replaces and deletes Unicode at the caret',async t=>{
 const {page,first,act}=await fixture(t,'<input aria-label="留言"><button>提交</button><p id="out"></p>');const ref=first.elements.find(e=>e.label==='留言').ref;
 await page.evaluate(()=>{const e=document.querySelector('input'),setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;Object.defineProperty(e,'value',{configurable:true,get(){return Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').get.call(this);},set(v){window.trackerWrites=(window.trackerWrites||0)+1;setter.call(this,v);}});window.inputs=0;e.addEventListener('input',()=>{window.inputs++;document.querySelector('#out').textContent=e.value;});});
 assert.equal((await act({action:'type',ref,text:'中文👋',clear:true})).verified,true);assert.equal(await page.locator('#out').textContent(),'中文👋');assert.equal(await page.evaluate(()=>window.trackerWrites||0),0);
 await act({action:'delete',ref,count:1});assert.equal(await page.locator('input').inputValue(),'中文');await act({action:'type',ref,text:'OK'});assert.equal(await page.locator('input').inputValue(),'中文OK');await act({action:'clear',ref});assert.equal(await page.locator('input').inputValue(),'');assert.equal(await page.evaluate(()=>inputs),4);
});
test('contenteditable edits honor an actual selection and caret rather than always appending',async t=>{
 const {page,first,act}=await fixture(t,'<div contenteditable="true" aria-label="编辑器">A👋BC</div>');const ref=first.elements[0].ref;
 await page.locator('[contenteditable]').focus();await page.evaluate(()=>{const e=document.querySelector('[contenteditable]'),r=document.createRange();r.setStart(e.firstChild,1);r.setEnd(e.firstChild,3);getSelection().removeAllRanges();getSelection().addRange(r);});
 await act({action:'type',ref,text:'中文'});assert.equal(await page.locator('[contenteditable]').textContent(),'A中文BC');
});
test('known targets survive unrelated page changes, scroll into the resized viewport and click once',async t=>{
 const {page,first,act}=await fixture(t,'<input aria-label="帐号"><button id="send">提交</button><span id="clock">1</span>');const ref=first.elements.find(e=>e.label==='提交').ref;
 await page.evaluate(()=>{document.querySelector('#clock').textContent='2';document.querySelector('#send').style.marginTop='900px';window.clicked=0;document.querySelector('#send').onclick=()=>window.clicked++;});await page.setViewportSize({width:390,height:320});
 const prepare=await act({action:'click',ref,phase:'prepare',expectedLabel:'提交'});assert.ok(prepare.y>=0&&prepare.y<320);await act({action:'click',ref,expectedLabel:'提交'});assert.equal(await page.evaluate(()=>clicked),1);
});
test('changed labels, covered controls, missing focus and previous document refs fail without side effects',async t=>{
 const {page,first,act}=await fixture(t,'<input aria-label="帐号"><button id="target">保存</button>');const ref=first.elements.find(e=>e.label==='保存').ref;
 await page.evaluate(()=>document.querySelector('#target').textContent='删除');await assert.rejects(act({action:'click',ref,expectedLabel:'保存'}),/含义已变化/);
 await page.evaluate(()=>{const cover=document.createElement('div');cover.style.cssText='position:fixed;inset:0;z-index:99;background:white';document.body.append(cover);});await assert.rejects(act({action:'click',ref}),/遮挡/);
 await assert.rejects(act({action:'type',text:'wrong'}),/目标已离开/);await page.setContent('<button>新页面</button>');await page.evaluate(OBSERVE_SCRIPT);await assert.rejects(act({action:'click',ref}),/目标已离开/);
});
test('page beforeinput cancellation prevents overwrites and password results never contain input text or length',async t=>{
 const {page,first,act}=await fixture(t,'<input aria-label="受保护"><input aria-label="密码" type="password">');const a=first.elements.find(e=>e.label==='受保护').ref,b=first.elements.find(e=>e.label==='密码').ref;
 await page.evaluate(()=>document.querySelector('input').addEventListener('beforeinput',e=>e.preventDefault()));await assert.rejects(act({action:'type',ref:a,text:'MUST_NOT_WRITE'}),/页面取消/);assert.equal(await page.locator('input').first().inputValue(),'');
 const result=await act({action:'type',ref:b,text:'PRIVATE_FIXTURE_PASSWORD'});assert.equal(result.verified,true);assert.equal('characters'in result,false);assert.equal(JSON.stringify(result).includes('PRIVATE_FIXTURE_PASSWORD'),false);
});
