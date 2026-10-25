import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {uiHarness,readyState,navigateStudio} from '../test/ui-harness.mjs';
const output=new URL('../preview/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
const screenshot=async(page,name)=>page.screenshot({animations:'disabled',path:new URL(name+'.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
try{
 const runtimeTools=JSON.parse(await readFile(new URL('../app/src/main/assets/runtime/manifest.json',import.meta.url),'utf8')).tools;
 const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
 const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',runtimeTools});await page.evaluate(s=>BridgeDashboard.render(s),{...readyState,version,permissions:{allFiles:false,notifications:true,batteryUnrestricted:false}});await screenshot(page,'studio-welcome');
 await page.locator('#session-menu').click();await screenshot(page,'studio-sidebar');await page.locator('#drawer-close').click();
 await page.locator('#chat-new').click();await navigateStudio(page,'files');await page.locator('.file-entry').first().click();await page.waitForFunction(()=>!document.querySelector('#file-editor').hidden);await screenshot(page,'studio-files');
 await page.locator('[data-navigate="tools"]').click();await page.waitForFunction(()=>document.querySelector('#runtime-state').textContent.includes('就绪'));await screenshot(page,'studio-tools');
 await navigateStudio(page,'terminal');await page.locator('#terminal-start').click();await page.waitForFunction(()=>document.querySelector('#terminal-state')?.textContent.includes('已连接'));await page.waitForTimeout(200);await screenshot(page,'studio-terminal');
 await navigateStudio(page,'chat');await page.evaluate(()=>BridgeDashboard.setTheme('dark'));await screenshot(page,'studio-dark');
 await page.setViewportSize({width:320,height:700});await screenshot(page,'studio-320');await context.close();
 const conversation={selected:'preview-chat',sessions:[{id:'preview-chat',project:'preview-project',title:'把一个想法变成作品',settings:{agent:true,thinking:false,search:true},status:'completed',messages:[{role:'user',content:'先看看这个项目，帮我理一下接下来怎么做。'},{role:'assistant',content:'我们可以从一个小的、能运行的版本开始。\n\n### 先把基础打稳\n\n- 确认入口和项目结构\n- 完成核心交互，再补充细节\n- 运行构建，检查真实结果\n\n```ts\nconst idea = {\n  status: "ready to build",\n  next: "make something useful"\n};\n```\n\n你可以在文件页查看代码，也可以直接打开终端。'}]}]};
 const {page:chat,context:chatContext}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat',clientState:conversation,runtimeTools});await screenshot(chat,'studio-conversation');await chat.locator('#session-menu').click();await screenshot(chat,'studio-sidebar-session');await chatContext.close();
 await writeFile(new URL('README.md',output),'# Studio UI previews\n\nActual packaged HTML/CSS/JS rendered in desktop Edge. Native state, files and PTY output are deterministic test fixtures; these images do not establish Android device or real-account verification. No generated mockup is used.\n');
 console.log('Captured 9 Studio UI previews from packaged assets.');
}finally{await browser.close();}
