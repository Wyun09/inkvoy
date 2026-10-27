import {readFile,writeFile} from 'node:fs/promises';
const [version,code]=process.argv.slice(2),root=new URL('../',import.meta.url);
if(!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(version||'')||!/^\d+$/.test(code||''))throw Error('Usage: node scripts/set-version.mjs VERSION VERSION_CODE');
for(const file of ['package.json','package-lock.json']){const url=new URL(file,root),raw=await readFile(url,'utf8'),json=JSON.parse(raw);json.version=version;if(json.packages?.[''])json.packages[''].version=version;const result=JSON.stringify(json,null,2)+'\n';await writeFile(url,raw.includes('\r\n')?result.replaceAll('\n','\r\n'):result);}
const manifest=new URL('app/src/main/AndroidManifest.xml',root),raw=await readFile(manifest,'utf8');await writeFile(manifest,raw.replace(/android:versionCode="\d+" android:versionName="[^"]+"/,'android:versionCode="'+code+'" android:versionName="'+version+'"'));
const pom=new URL('test/android-runtime/pom.xml',root);await writeFile(pom,(await readFile(pom,'utf8')).replace(/(<artifactId>android-startup-regression<\/artifactId><version>)[^<]+/,'$1'+version));
console.log('Prepared '+version+' ('+code+')');
