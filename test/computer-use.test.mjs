import test from 'node:test';import assert from 'node:assert/strict';import {chromium} from 'playwright';
import {OBSERVE_SCRIPT} from '../js/browser-observation.js';import {browserAddress} from '../js/ui/computer.js';import {createClient,LOCAL_TOOLS} from '../js/client.js';
const launch=()=>chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
const fixture=`<meta name="viewport" content="width=device-width"><style>body{font:16px system-ui;margin:20px}input,button{font:inherit;padding:12px}#hidden{display:none}.space{height:1500px}</style><h1>Computer use fixture</h1><form id="f"><label>留言<input aria-label="留言" id="message"></label><button>提交留言</button></form><p id="result"></p><input type="password" value="NEVER_RETURN_THIS_PASSWORD"><button id="hidden">HIDDEN_TARGET</button><div class="space"></div><button>页尾按钮</button><script>document.querySelector('form').onsubmit=e=>{e.preventDefault();document.querySelector('#result').textContent='已收到：'+document.querySelector('input').value}</script>`;
test('browser address normalization keeps local preview local and rejects privileged schemes',()=>{
 assert.equal(browserAddress('localhost:5173'),'http://localhost:5173/');assert.equal(browserAddress('127.0.0.1:8000/demo'),'http://127.0.0.1:8000/demo');assert.equal(browserAddress('example.com'),'https://example.com/');assert.match(browserAddress('测试 浏览器'),/^https:\/\/www.bing.com\/search\?q=/);
 for(const value of ['javascript:alert(1)','file:///private/key','content://secret','https://bridge.local/engine.html','https://user:pass@example.com'])assert.throws(()=>browserAddress(value));
});
test('page observations expose visible control coordinates, omit offscreen/hidden controls and private values',async t=>{
 const browser=await launch();t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:390,height:640}});await page.setContent(fixture);const value=await page.evaluate(OBSERVE_SCRIPT);
 assert.equal(value.viewport.width,390);assert.ok(value.elements.some(e=>e.label==='留言'&&e.x>0&&e.y>0));assert.ok(!value.elements.some(e=>e.label==='HIDDEN_TARGET'||e.label==='页尾按钮'));assert.ok(!JSON.stringify(value).includes('NEVER_RETURN_THIS_PASSWORD'));
 await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));const scrolled=await page.evaluate(OBSERVE_SCRIPT);assert.ok(scrolled.elements.some(e=>e.label==='页尾按钮'));assert.ok(!scrolled.elements.some(e=>e.label==='留言'));
});
test('client runs a complete observe-click-type-click-observe browser tool chain against a real renderer',async t=>{
 const browser=await launch();t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:390,height:640}});await page.setContent(fixture);let revision=0,round=0;const actions=[],requests=[];
 const observe=async()=>({...await page.evaluate(OBSERVE_SCRIPT),observation:'obs-'+(++revision),ok:true});
 const reply=(content,calls)=>({choices:[{message:{role:'assistant',content,...(calls?{tool_calls:calls}:{})}}],usage_meta:{agent_status:calls?'running':'complete'}});
 const call=args=>[{id:'browser-call-'+round,type:'function',function:{name:'browser',arguments:JSON.stringify(args)}}];
 const client=createClient({saveState:()=>true,cancel:()=>{},native:async(operation,a)=>{
   if(operation==='project.ensure')return true;assert.equal(operation,'tool.execute');assert.equal(a.name,'browser');const args=a.args;actions.push(args.action);if(args.action!=='observe')assert.equal(args.observation,'obs-'+revision);
   if(args.action==='click'){await page.mouse.move(args.x,args.y);await page.mouse.click(args.x,args.y);}if(args.action==='type')await page.keyboard.type(args.text);return observe();
 },request:async(id,body)=>{requests.push(body);round++;const previous=body.messages.filter(m=>m.role==='tool').at(-1);const current=previous?JSON.parse(previous.content):null;
   if(round===1)return reply('先观察页面',call({action:'observe'}));
   if(round===2){const e=current.elements.find(e=>e.label==='留言');return reply('点击留言输入框',call({action:'click',x:e.x,y:e.y,observation:current.observation}));}
   if(round===3)return reply('输入内容',call({action:'type',text:'CURSOR_FORM_OK',observation:current.observation}));
   if(round===4){const e=current.elements.find(e=>e.label==='提交留言');return reply('提交并检查结果',call({action:'click',x:e.x,y:e.y,observation:current.observation}));}
   assert.match(current.text,/已收到：CURSOR_FORM_OK/);return reply('页面已确认收到留言。');
 }});
 await client.send('填写并提交测试留言');assert.equal(await page.locator('#result').textContent(),'已收到：CURSOR_FORM_OK');assert.deepEqual(actions,['observe','click','type','click']);assert.equal(client.current().status,'completed');assert.equal(client.current().messages.filter(m=>m.role==='tool').length,4);assert.ok(requests[0].tools.some(t=>t.function.name==='browser'));
});
test('vision-enabled connections attach only the current screenshot to requests, without persisting base64',async()=>{
 let round=0;const saved=[],requests=[];const client=createClient({saveState:raw=>{saved.push(raw);return true;},modelInfo:()=>({name:'Vision',model:'vision-model',source:'api',provider:{vision:true}}),cancel:()=>{},native:async(op,a)=>op==='tool.execute'?{ok:true,screenshot:{id:'capture-1'},observation:'visible'}:op==='browser.image'?'data:image/jpeg;base64,SCREENSHOT_ONLY_ON_WIRE':true,request:async(id,body)=>{requests.push(structuredClone(body));return {choices:[{message:++round===1?{role:'assistant',content:'观察',tool_calls:[{id:'capture-call',type:'function',function:{name:'browser',arguments:'{"action":"observe"}'}}]}:{role:'assistant',content:'已查看。'}}]};}});
 await client.send('查看页面');assert.equal(requests.length,2);assert.ok(requests[1].messages.some(m=>Array.isArray(m.content)&&m.content[1].image_url.url.includes('SCREENSHOT_ONLY_ON_WIRE')));assert.ok(!saved.join('').includes('SCREENSHOT_ONLY_ON_WIRE'));assert.ok(LOCAL_TOOLS.some(t=>t.function.name==='browser'));
});

test('stable control refs survive unrelated countdowns, exclude covered targets and track focused inputs without values',async t=>{
 const browser=await launch();t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:390,height:640}});
 await page.setContent('<meta name="viewport" content="width=device-width"><button id="count">倒计时 10</button><input aria-label="帐号" value="PRIVATE_VALUE"><div style="position:relative"><button id="covered">不能点</button><div style="position:absolute;inset:0;background:white"></div></div>');
 const first=await page.evaluate(OBSERVE_SCRIPT),ref=first.elements.find(e=>e.label==='帐号').ref;
 await page.locator('#count').textContent();await page.evaluate(()=>document.querySelector('#count').textContent='倒计时 9');await page.locator('input').focus();
 const second=await page.evaluate(OBSERVE_SCRIPT);assert.equal(second.elements.find(e=>e.label==='帐号').ref,ref);assert.equal(second.focused.ref,ref);assert.equal(second.focused.editable,true);assert.ok(!JSON.stringify(second).includes('PRIVATE_VALUE'));assert.ok(!second.elements.some(e=>e.label==='不能点'));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});const zoomed=await page.evaluate(OBSERVE_SCRIPT);assert.ok(zoomed.viewport.width<390);assert.equal(zoomed.viewport.scale,2);assert.ok(zoomed.elements.every(e=>e.x>=0&&e.x<zoomed.viewport.width));
});

test('browser tool schema exposes target refs, replace, clear, Unicode deletion and zoom',()=>{
 const props=LOCAL_TOOLS.find(t=>t.function.name==='browser').function.parameters.properties;
 for(const action of ['click','type','clear','delete','zoom'])assert.ok(props.action.enum.includes(action));
 assert.equal(props.ref.type,'string');assert.equal(props.count.maximum,1000);assert.deepEqual(props.direction.enum,['backward','forward']);assert.equal(props.scale.minimum,.5);
});
