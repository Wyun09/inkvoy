import {readFile,writeFile,stat,copyFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),delivery=resolve(process.argv[2]||'dist');
const read=name=>readFile(join(root,name),'utf8'),json=async name=>JSON.parse(await read(name));
const {version}=await json('package.json'),tag=version.replaceAll('.','');
const manifest=await read('app/src/main/AndroidManifest.xml'),versionCode=Number(manifest.match(/android:versionCode="(\d+)"/)[1]);
const javascript=await read('verification/regression-js-final-'+tag+'.log'),native=await read('verification/regression-android-'+tag+'.log'),finalResources=await read('verification/android-final-payload-'+tag+'.log');
const jsTests=Number(javascript.match(/ℹ tests (\d+)/)?.[1]),jsPass=Number(javascript.match(/ℹ pass (\d+)/)?.[1]);
const nativeResult=[...native.matchAll(/Tests run:\s*(\d+), Failures:\s*(\d+), Errors:\s*(\d+), Skipped:\s*(\d+)/g)].at(-1);
const resourceResult=[...finalResources.matchAll(/Tests run:\s*(\d+), Failures:\s*(\d+), Errors:\s*(\d+), Skipped:\s*(\d+)/g)].at(-1);
if(!jsTests||jsTests!==jsPass||!javascript.includes('ℹ fail 0')||!javascript.includes('ℹ cancelled 0')||!javascript.includes('ℹ skipped 0')||!native.includes('BUILD SUCCESS')||!nativeResult||nativeResult.slice(2).some(n=>Number(n)!==0)||!finalResources.includes('BUILD SUCCESS')||!resourceResult||Number(resourceResult[1])<22||resourceResult.slice(2).some(n=>Number(n)!==0))throw Error('Final regression results must pass before recording a release');
const digest=async path=>{const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex');};
const variants={};
for(const flavor of ['lite','offline']){
 const report=await json('verification/apk-payload-'+flavor+'-'+tag+'.json'),path=join(delivery,report.apk);
 if(report.sha256!==await digest(path)||!report.compiledDexMatched||!report.sameSignerAsV1||report.versionCode!==versionCode)throw Error('APK report does not match delivery: '+flavor);
 variants[flavor]={file:report.apk,bytes:(await stat(path)).size,sha256:report.sha256,runtimeImageBundled:flavor==='offline'};
}
const runtime=await json('app/src/main/assets/runtime/manifest.json'),layout=await json('preview/'+version+'/after-layout.json'),bundle=await json('verification/ui-engine-bundle-'+tag+'.json'),performance=await json('verification/ui-performance-'+tag+'.json');
if(layout.length<28||layout.some(row=>row.overflow))throw Error('Layout audit is incomplete or contains horizontal overflow');
if(!bundle.engineMinified||bundle.legacyCoreStylesBundled!==false)throw Error('Production assets were not built with the current core style owner');
if(performance.combined.length<2||performance.combined.some(row=>row.samples<50||row.repeatedLayouts.some(count=>count!==0)))throw Error('Performance comparison is incomplete or contains repeated native layout submissions');
const previous=await json('release.json'),frameworkTests=Number(nativeResult[1]),buildDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const changes=['Rebuild mobile headers, contextual actions and the unified message composer.','Introduce a reversible action sheet with focus handling and native browser suspension.','Refine conversation, files, terminal, model and settings surfaces.','Remove conflicting core selectors at build time and minimize production assets.','Keep long reasoning bounded and reverse disclosure motion in the correct zoom coordinates.'];
const release={...previous,version,versionCode,buildDate,apk:variants.offline.file,bytes:variants.offline.bytes,sha256:variants.offline.sha256,variants,runtime,androidFrameworkTests:frameworkTests,finalSignedResourceChecks:Number(resourceResult[1]),javascriptChecksValidated:jsTests,distribution:'local lite and offline builds',physicalAndroidDeviceVerified:false,releaseAttachmentsUploaded:false,verification:'verification/regression-'+tag+'.json',changes};delete release.focusedLayoutChecks;
const verification={version,versionCode,recordedAt:new Date().toISOString(),javascript:{tests:jsTests,passed:jsPass,failed:0,log:'regression-js-final-'+tag+'.log'},android:{tests:frameworkTests,failed:0,errors:0,skipped:0,apis:[26,33],log:'regression-android-'+tag+'.log'},finalSignedResources:{tests:Number(resourceResult[1]),failed:0,errors:0,skipped:0,log:'android-final-payload-'+tag+'.log',includedInFrameworkTestCount:true},layout:{routeSnapshots:layout.length,viewports:new Set(layout.map(r=>r.case)).size,horizontalOverflow:0},assets:{coreStyleOwner:bundle.coreStyleOwner,engineMinified:bundle.engineMinified,engineBytes:(await stat(join(root,'app/src/main/assets/engine.bundle.js'))).size,cssBytes:bundle.cssBytes,removedLegacyCoreSelectors:bundle.prunedFeatures.reduce((sum,item)=>sum+item.removedSelectors,0)},performance:{log:'ui-performance-'+tag+'.json',environment:performance.environment,combined:performance.combined},variants,physicalAndroidDeviceVerified:false,releaseAttachmentsUploaded:false};
await writeFile(join(root,'release.json'),JSON.stringify(release,null,2)+'\n');
await writeFile(join(root,'verification/regression-'+tag+'.json'),JSON.stringify(verification,null,2)+'\n');
await writeFile(join(delivery,'artifacts.json'),JSON.stringify(release,null,2)+'\n');
await writeFile(join(delivery,'SHA256SUMS.txt'),Object.values(variants).map(a=>a.sha256+'  '+a.file).join('\n')+'\n');
await copyFile(join(root,'docs/RELEASE-'+version+'.md'),join(delivery,'使用与更新说明.md'));
console.log(JSON.stringify({version,versionCode,javascriptChecks:jsTests,androidFrameworkChecks:frameworkTests,variants,delivery},null,2));
