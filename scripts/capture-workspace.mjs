import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {uiHarness} from '../test/ui-harness.mjs';
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
const output=new URL('../preview/',import.meta.url),file=name=>new URL(name,output).pathname.replace(/^\/([A-Za-z]:)/,'$1'),images=[];
try{
 const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'chat'});
 await page.locator('#chat-input').fill('继续检查网页表单，填错时清空后再输入。');
 await page.locator('#client-browser').click();await page.locator('#computer-split').click();
 await page.evaluate(()=>{document.querySelector('.computer-empty').hidden=true;const slot=document.querySelector('#computer-slot'),f=document.createElement('iframe');f.id='preview-native-standin';f.title='仅供排版检查的网页夹具';f.style='border:0;width:100%;height:100%;display:block';f.srcdoc='<meta name="viewport" content="width=device-width"><style>body{font:14px/1.6 system-ui;margin:16px;color:#34332f}label{display:block;font-size:12px;color:#777}input{box-sizing:border-box;width:100%;border:1px solid #ddd;border-radius:6px;padding:10px;font:16px system-ui;margin:4px 0 10px}button{border:0;border-radius:6px;background:#b66a4c;color:white;padding:10px 22px}small{color:#999}</style><small>交互测试页面 · 本机夹具</small><h3>网页表单</h3><label>名称<input placeholder="输入内容后可替换或清空"></label><button>提交</button>';slot.append(f);});
 await page.waitForTimeout(100);for(const [width,height,name]of [[390,844,'workspace-240-portrait.png'],[844,390,'workspace-240-landscape.png']]){await page.setViewportSize({width,height});await page.waitForTimeout(150);await page.screenshot({path:file(name),animations:'disabled'});images.push(name);}
 await page.setViewportSize({width:390,height:844});await page.locator('#computer-chat').click();await page.locator('#session-menu').click();await page.locator('#drawer-settings').evaluate(n=>n.open=true);await page.locator('#display-orientation').scrollIntoViewIfNeeded();await page.screenshot({path:file('workspace-240-settings.png'),animations:'disabled'});images.push('workspace-240-settings.png');await context.close();
 await writeFile(new URL('workspace-240-preview.json',output),JSON.stringify({productionUi:true,nativeAndroidSurface:false,remoteWebpage:'explicit local iframe fixture for layout only',physicalAndroidDevice:false,images},null,2)+'\n');console.log(JSON.stringify({images}));
}finally{await browser.close();}