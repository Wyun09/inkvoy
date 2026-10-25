import {uiHarness} from './ui-harness.mjs';
export async function streamFixture(browser,options={}){
 const profile={id:'stream-api',name:'Stream fixture',model:'stream-model',endpoint:'https://example.test/v1',modelCapabilities:[{id:'stream-model',levels:['low','high']}]};
 const state={selected:'stream',sessions:[{id:'stream',project:'p-stream',title:'回复动效验证',status:'idle',settings:{agent:false},messages:[]}]};
 const f=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',clientState:state,providerState:{selected:profile.id,profiles:[profile]},...options});
 await f.page.emulateMedia({reducedMotion:'no-preference'});
 await f.page.evaluate(()=>{NativeBridge.providerRequest=(id,raw)=>window.providerCalls.push({id,...JSON.parse(raw)});});
 await f.page.locator('#chat-input').fill('检查输入边界并解释验证方法。');await f.page.locator('#chat-send').click();
 await f.page.waitForFunction(()=>providerCalls.some(c=>c.operation==='chat'));
 return f;
}
export async function delta(page,value){await page.evaluate(value=>{const request=providerCalls.findLast(c=>c.operation==='chat');AndroidEngine.providerEvent(request.id,{type:'data',text:'data: '+JSON.stringify({choices:[{delta:value}]})+'\n\n'});},value);}
export async function complete(page){await page.evaluate(()=>{const request=providerCalls.findLast(c=>c.operation==='chat');AndroidEngine.providerEvent(request.id,{type:'data',text:'data: '+JSON.stringify({choices:[{delta:{},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n'});AndroidEngine.providerEvent(request.id,{type:'end'});});}
