// Desktop layout previews of the production assets with explicit Native/model fixtures.
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {uiHarness,readyState} from '../test/ui-harness.mjs';
const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
const destination=new URL('../preview/'+version+'/',import.meta.url);
await mkdir(destination,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
const previews=[];
const take=async(page,name)=>{await page.waitForTimeout(450);await page.screenshot({path:new URL(name+'.png',destination).pathname.replace(/^\/([A-Za-z]:)/,'$1')});previews.push(name+'.png');};
try{
 const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',providerState:{selected:'web',profiles:[{id:'preview-api',kind:'api',name:'示例 API',endpoint:'https://api.example.test/v1',model:'example-model',key:''}]}});
 await page.evaluate(state=>BridgeDashboard.render(state),readyState);
 await take(page,'chat');
 await page.locator('#session-menu').click();await take(page,'drawer');
 await page.keyboard.press('Escape');await page.locator('#model-picker').click();await take(page,'models');
 await page.keyboard.press('Escape');await page.evaluate(()=>BridgeDashboard.navigate('accounts'));await take(page,'accounts');
 await page.evaluate(()=>BridgeDashboard.navigate('extensions'));await page.locator('#mcp-add').click();await take(page,'mcp');
 await page.evaluate(()=>BridgeDashboard.navigate('settings'));await take(page,'settings');
 await page.evaluate(()=>document.querySelector('#settings-theme').click());await take(page,'settings-dark');
 await context.close();
 const clientState={selected:'preview',sessions:[{id:'preview',project:'p-preview',title:'检查项目与构建',settings:{agent:true},status:'interrupted',notice:'检查后继续',messages:[{role:'user',content:'检查项目，修复类型错误并验证构建。'},{role:'assistant',content:'先确认关键配置和源文件，再运行构建检查。',tool_calls:[{id:'preview-read',type:'function',function:{name:'read_file',arguments:'{"path":"package.json"}'}}]},{role:'tool',tool_call_id:'preview-read',content:JSON.stringify({ok:true,content:'{"scripts":{"build":"tsc -b && vite build"}}'})},{role:'assistant',content:'构建脚本已确认，现在运行 TypeScript 和 Vite 检查。',tool_calls:[{id:'preview-build',type:'function',function:{name:'terminal',arguments:'{"command":"npm run build"}'}}]}]}]};
 const work=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',clientState,holdTools:true});
 await work.page.evaluate(state=>BridgeDashboard.render(state),readyState);await work.page.locator('#client-resume').click();await work.page.waitForFunction(()=>document.querySelector('#task-companion').dataset.pose==='terminal');await take(work.page,'working');await work.context.close();
 await writeFile(new URL('../verification/ui-previews-'+version.replaceAll('.','')+'.json',import.meta.url),JSON.stringify({version,date:'2026-10-21',viewport:{width:390,height:844},assets:'Final production HTML/CSS/JS',native:'Explicit deterministic test fixture; no Android device or account',animationSettleMs:450,files:previews.map(name=>'preview/'+version+'/'+name)},null,2)+'\n');
 console.log(JSON.stringify({previews}));
}finally{await browser.close();}
