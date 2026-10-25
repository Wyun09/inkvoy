import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {uiHarness,readyState} from '../test/ui-harness.mjs';
const baseline=process.argv[2];
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
const messages=[];for(let i=0;i<60;i++)messages.push({role:'user',content:'检查任务 '+i},{role:'assistant',content:'读取并验证。',tool_calls:[{id:'call-'+i,type:'function',function:{name:'read_file',arguments:'{"path":"fixture.py"}'}}]},{role:'tool',tool_call_id:'call-'+i,content:JSON.stringify({ok:true,content:'print("fixture line")\n'.repeat(500)})},{role:'assistant',content:'任务 '+i+' 已完成。\n\n```python\nprint("verified")\n```'});
const clientState={selected:'perf',sessions:[{id:'perf',project:'p-perf',title:'性能夹具',status:'completed',settings:{agent:true},messages}]};
const results=[];
try{
 const configurations=[...(baseline?[['2.4.1 signed APK',pathToFileURL(baseline.replace(/[\\/]$/,'')+'/')]]:[]),['3.0.0 current bundle',undefined]];
 for(let repeat=0;repeat<2;repeat++)for(const [name,assetsDirectory] of (repeat===0?configurations:[...configurations].reverse())){
  const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',clientState,assetsDirectory});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await page.waitForTimeout(400);
  const measured=await page.evaluate(async state=>{
   const nativeBefore=nativeLayouts.length;for(let i=0;i<100;i++)BridgeDashboard.render(state);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const repeatedLayouts=nativeLayouts.length-nativeBefore;
   const samples=[];for(let i=0;i<25;i++){const begin=performance.now();StudioUI.render({selected:'perf',sessions:[],active:null});samples.push(performance.now()-begin);await new Promise(r=>requestAnimationFrame(r));}
   samples.sort((a,b)=>a-b);
   return {repeatedLayouts,renderMedianMs:samples[Math.floor(samples.length/2)],renderP95Ms:samples[Math.floor(samples.length*.95)],mountedTurns:document.querySelectorAll('.reply-turn').length,hiddenLogCodeBlocks:document.querySelectorAll('.reply-step-result .reply-code').length,chatElements:document.querySelectorAll('#chat-messages *').length,samples};
  },readyState);results.push({name,repeat:repeat+1,...measured});await context.close();
 }
 const combined=configurations.map(([name])=>{const runs=results.filter(r=>r.name===name),samples=runs.flatMap(r=>r.samples).sort((a,b)=>a-b);return {name,renderMedianMs:samples[Math.floor(samples.length/2)],renderP95Ms:samples[Math.floor(samples.length*.95)],samples:samples.length,repeatedLayouts:runs.map(r=>r.repeatedLayouts),mountedTurns:runs.map(r=>r.mountedTurns),chatElements:runs.map(r=>r.chatElements)};});
 const report={environment:'Desktop Edge, 390 x 844 CSS pixels, 4x CPU throttle. Synthetic 60-turn history. This is not a physical Android frame-rate measurement.',method:'Two runs per version with reversed second-run order; 25 samples per run. No concurrent regression suite.',date:new Date().toISOString(),combined,results};
 await writeFile(new URL('../verification/ui-performance-300.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
