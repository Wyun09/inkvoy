import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {uiHarness,readyState} from './ui-harness.mjs';

test('the actual service action remains legible and operational in light and dark overview themes',async t=>{
  const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
  t.after(()=>browser.close());
  const {page,context}=await uiHarness(browser,{width:390,height:844},{studio:true,initialPage:'home'});
  t.after(()=>context.close());
  await page.evaluate(v=>BridgeDashboard.render(v),readyState);

  for(const dark of [false,true]){
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('dark')),dark);
    const contrast=await page.locator('#service-toggle').evaluate(async e=>{
      // Flush the new theme styles, then sample the settled colors. Reading an
      // arbitrary frame of the color transition makes this depend on CPU speed.
      getComputedStyle(e).backgroundColor;
      await Promise.all(e.getAnimations().map(animation=>animation.finished));
      const s=getComputedStyle(e);
      const luminance=value=>{
        const rgb=value.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{
          v/=255;
          return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
        });
        return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
      };
      const a=luminance(s.color),b=luminance(s.backgroundColor);
      return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    });
    assert.ok(contrast>=4.5,`${dark?'dark':'light'} service label contrast ${contrast}`);
    const before=await page.evaluate(()=>nativeActions.filter(a=>a.action==='stop').length);
    await page.locator('#service-toggle').click();
    assert.equal(await page.evaluate(()=>nativeActions.filter(a=>a.action==='stop').length),before+1);
    if(!dark)await page.locator('#theme').click();
  }
});
