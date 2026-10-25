import {chromium} from 'playwright';import {readFile,writeFile,rename} from 'node:fs/promises';
import {streamFixture,delta,complete} from '../test/stream-ui-fixture.mjs';
const root=new URL('../',import.meta.url),directory=new URL('preview/5.0.0/',root),path=name=>new URL(name,directory).pathname.replace(/^\/([A-Za-z]:)/,'$1');
const report=JSON.parse(await readFile(new URL('verification/ui-previews-500.json',root),'utf8')),files=new Set(report.files),errors=[];
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
try{
 const {page,context}=await streamFixture(browser,{recordVideo:{dir:path('motion'),size:{width:390,height:844}}});page.on('pageerror',e=>errors.push(e.message));
 await delta(page,{reasoning_content:'先读取入口，确认路径边界和输入长度。\n'});await page.waitForFunction(()=>document.querySelector('.reply-thought')?.textContent.includes('路径边界'));await page.locator('.reply-thinking summary').click();await page.waitForTimeout(500);
 await delta(page,{reasoning_content:'接着对照失败分支，检查附件是否保留。\n'});await page.waitForTimeout(700);await delta(page,{reasoning_content:'最后核对退出码与测试证据，区分已验证内容和待确认事项。'});await page.waitForTimeout(700);await page.screenshot({path:path('studio-thinking-flow.png')});files.add('preview/5.0.0/studio-thinking-flow.png');
 const pieces=['## 检查结果\n\n','路径与大小检查应在写入前执行，','失败时保留用户已经选择的文件。\n\n','## 验证方法\n\n','分别覆盖空路径、目录外路径、超大文件与取消上传；','检查退出码后再报告完成。\n\n','当前页面为动效验收夹具，尚未在手机执行这些检查。'];
 for(const content of pieces){await delta(page,{content});await page.waitForTimeout(530);}
 await page.screenshot({path:path('studio-streaming-flow.png')});files.add('preview/5.0.0/studio-streaming-flow.png');await complete(page);await page.waitForFunction(()=>document.querySelector('.reply-turn')?.dataset.status==='completed');await page.waitForTimeout(700);await page.screenshot({path:path('studio-streaming-complete.png')});files.add('preview/5.0.0/studio-streaming-complete.png');
 const video=page.video();await context.close();await rename(await video.path(),path('studio-stream-motion.webm'));files.add('preview/5.0.0/studio-stream-motion.webm');report.files=[...files];report.javascriptErrors=[...report.javascriptErrors,...errors];report.streamingFixture='Actual SSE adapter and UI, deterministic whole-chunk callbacks. No synthetic character queue. Not a physical phone or remote inference.';report.date=new Date().toISOString();await writeFile(new URL('verification/ui-previews-500.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({files:files.size,errors}));if(errors.length)throw new Error('Streaming preview error');
}finally{await browser.close();}
