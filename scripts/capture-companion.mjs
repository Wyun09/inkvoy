// Real client state transitions through the test NativeBridge contract.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {uiHarness} from '../test/ui-harness.mjs';
const output=new URL('../preview/',import.meta.url);
const path=url=>url.pathname.replace(/^\/([A-Za-z]:)/,'$1');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
try{
 const calls=[['read_file',{path:'package.json'}],['terminal',{command:'npm run build'}],['write_file',{path:'README.md',content:'Updated project notes.'}]].map(([name,args],index)=>({id:'preview-tool-'+index,type:'function',function:{name,arguments:JSON.stringify(args)}}));
 const clientState={selected:'companion-preview',sessions:[{id:'companion-preview',project:'p-preview',title:'检查并整理项目',settings:{agent:true},status:'interrupted',notice:'可继续任务',messages:[{role:'user',content:'检查项目，运行构建并更新说明。'},{role:'assistant',content:'我会读取配置，运行构建，再根据结果更新说明。',tool_calls:calls}]}]};
 const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,holdTools:true,initialPage:'chat',clientState});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#client-resume').click();
 for(const [name,pose]of [['read_file','reading'],['terminal','terminal'],['write_file','writing']]){
   await page.waitForFunction(pose=>document.querySelector('#task-companion').dataset.pose===pose,pose);
   await page.screenshot({path:path(new URL('studio-pet-'+pose+'.png',output))});
   // Two time samples document that the displayed pose is actually animated.
   const transforms=[];for(let i=0;i<4;i++){transforms.push(await page.locator('.companion-sprite').evaluate(n=>getComputedStyle(n).transform));await page.waitForTimeout(230);}
   if(new Set(transforms).size<2)throw new Error('Pet did not animate: '+pose);
   await page.evaluate(name=>{const call=workspaceCalls.find(c=>c.operation==='tool.execute'&&c.args.name===name);AndroidEngine.workspaceRpc(call.id,{ok:true,value:{ok:true,stdout:'Preview fixture result',exitCode:0}});},name);
 }
 await page.waitForFunction(()=>document.querySelector('#task-companion').dataset.pose==='thinking');
 await page.screenshot({path:path(new URL('studio-pet-generating.png',output))});
 await context.close();
 await writeFile(new URL('companion-animation.json',output),JSON.stringify({source:'Production bundle and actual createClient tool transitions; Native tool results are explicit fixtures.',poses:['reading','terminal','writing','thinking'],animatedPosesChecked:3,reducedMotionVerifiedBy:'test/studio-ui.test.mjs',physicalAndroidDevice:false},null,2)+'\n');
 console.log('Captured live pet states and checked animation transforms.');
}finally{await browser.close();}
