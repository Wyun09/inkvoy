import {chromium} from 'playwright';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),run=promisify(execFile),records=[];
const registry=join(homedir(),'AppData/Local/ms-playwright'),ffmpeg=process.argv[2]||join(registry,(await readdir(registry)).filter(n=>n.startsWith('ffmpeg-')).sort().at(-1),'ffmpeg-win64.exe');
const video='preview/5.1.0/studio-onboarding-motion.webm';let metadata='';
try{await run(ffmpeg,['-hide_banner','-i',fileURLToPath(new URL(video,root))]);}catch(e){metadata=e.stderr||'';}
const duration=metadata.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);if(!duration)throw new Error('Cannot inspect video duration');
const seconds=Number(duration[1])*3600+Number(duration[2])*60+Number(duration[3]),times=[.30,.58,.88].map(n=>seconds*n),hashes=[],frames=[],images=[];
for(const [i,time]of times.entries()){
 const path='preview/5.1.0/studio-onboarding-motion-frame-'+(i+1)+'.png';await run(ffmpeg,['-hide_banner','-loglevel','error','-ss',time.toFixed(3),'-i',fileURLToPath(new URL(video,root)),'-frames:v','1','-y',fileURLToPath(new URL(path,root))]);
 const bytes=await readFile(new URL(path,root));hashes.push(createHash('sha256').update(bytes).digest('hex'));frames.push(path);images.push(bytes.toString('base64'));
}
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
try{
 const page=await browser.newPage({viewport:{width:1170,height:880},deviceScaleFactor:1});await page.setContent('<body style="margin:0;display:flex;font:12px sans-serif;background:#fafafa">'+images.map((data,i)=>'<figure style="margin:0;width:390px"><figcaption style="padding:6px">onboarding · '+times[i].toFixed(2)+'s</figcaption><img width="390" height="844" src="data:image/png;base64,'+data+'"></figure>').join('')+'</body>');await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
 const contactSheet='preview/5.1.0/studio-onboarding-motion-contact.png';await page.screenshot({path:fileURLToPath(new URL(contactSheet,root))});records.push({video,contactSheet,frames,durationSeconds:seconds,times,frameHashes:hashes,distinctFrames:new Set(hashes).size});if(records[0].distinctFrames<2)throw new Error('Recorded UI states do not change');
 const report={version:'5.1.0',method:'FFmpeg decodes the production UI video at 30/58/88 percent, after startup; exported frames require visual inspection. Native/account/app data are fixtures, not a connected phone.',records};await writeFile(new URL('verification/ui-motion-510.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
