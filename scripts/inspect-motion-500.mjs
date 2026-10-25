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
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
try{
 const page=await browser.newPage({viewport:{width:1170,height:880},deviceScaleFactor:1});
 for(const name of ['studio-working-motion.webm','studio-logo-forms.webm','studio-team-motion.webm','studio-stream-motion.webm']){
  const video='preview/5.0.0/'+name;let metadata='';try{await run(ffmpeg,['-hide_banner','-i',fileURLToPath(new URL(video,root))]);}catch(e){metadata=e.stderr||'';}
  const duration=metadata.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);if(!duration)throw new Error('Cannot inspect video duration');
  const seconds=Number(duration[1])*3600+Number(duration[2])*60+Number(duration[3]),times=[.40,.55,.70].map(n=>seconds*n),hashes=[],frames=[],images=[];
  const kind=name.includes('working')?'working':name.includes('team')?'team':name.includes('stream')?'stream':'logo';
  for(const [i,time]of times.entries()){
   const image='preview/5.0.0/studio-'+kind+'-motion-frame-'+(i+1)+'.png';
   await run(ffmpeg,['-hide_banner','-loglevel','error','-ss',time.toFixed(3),'-i',fileURLToPath(new URL(video,root)),'-frames:v','1','-y',fileURLToPath(new URL(image,root))]);
   const bytes=await readFile(new URL(image,root));hashes.push(createHash('sha256').update(bytes).digest('hex'));frames.push(image);images.push(bytes.toString('base64'));
  }
  await page.setContent('<body style="margin:0;display:flex;font:12px sans-serif;background:#fafafa">'+images.map((data,i)=>'<figure style="margin:0;width:390px"><figcaption style="padding:6px">'+kind+' · '+times[i].toFixed(2)+'s</figcaption><img width="390" height="844" src="data:image/png;base64,'+data+'"></figure>').join('')+'</body>');
  await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
  const contactSheet='preview/5.0.0/studio-'+kind+'-motion-contact.png';await page.screenshot({path:fileURLToPath(new URL(contactSheet,root))});
  records.push({video,contactSheet,frames,durationSeconds:seconds,times,frameHashes:hashes,distinctFrames:new Set(hashes).size});
 }
 if(records.some(r=>r.distinctFrames<2))throw new Error('Video did not show different frames');
 const report={version:'5.0.0',method:'FFmpeg decodes actual recorded production UI videos at 40/55/70 percent; exported frames are visually inspected. Native/model data are fixtures.',records};await writeFile(new URL('verification/ui-motion-500.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
