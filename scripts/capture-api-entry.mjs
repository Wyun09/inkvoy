import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {uiHarness} from '../test/ui-harness.mjs';
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
const output=new URL('../preview/',import.meta.url),file=name=>new URL(name,output).pathname.replace(/^\/([A-Za-z]:)/,'$1');
try{
 for(const [width,height,name]of [[390,844,'api-232-direct-form.png'],[320,700,'api-232-narrow-form.png']]){
  const {page,context}=await uiHarness(browser,{width,height},{studio:true,initialPage:'chat'});await page.locator('#session-menu').click();await page.locator('#model-settings-open').click();await page.locator('#provider-endpoint').waitFor({state:'visible'});await page.screenshot({path:file(name),animations:'disabled'});await context.close();
 }
 await writeFile(new URL('api-232-preview.json',output),JSON.stringify({productionUi:true,physicalAndroidDevice:false,nativeState:'explicit fixtures',openingPath:'Sidebar > Models and API; no dropdown selection or prepared profiles',fieldsVisibleOnFirstOpen:['API address','API key','model ID'],previews:['api-232-direct-form.png','api-232-narrow-form.png']},null,2)+'\n');console.log('Captured the unconfigured API form opened directly from the sidebar.');
}finally{await browser.close();}
