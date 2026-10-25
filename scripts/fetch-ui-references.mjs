// Download only public, pinned UI references and a local OFL font.
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),headers={'User-Agent':'Inkvoy-UI-Source-Review','Accept':'application/vnd.github+json'};
async function fetchBytes(url){const response=await fetch(url,{headers,signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(response.status+' '+url);return Buffer.from(await response.arrayBuffer());}
const digest=value=>createHash('sha256').update(value).digest('hex');
const references=new URL('third_party/ui-v4/',root);await mkdir(references,{recursive:true});
const commit=JSON.parse((await fetchBytes('https://api.github.com/repos/shadcn-ui/ui/commits/main')).toString()).sha;
const files={};
for(const [target,path]of [['LICENSE.md','LICENSE.md'],['command.tsx','apps/v4/registry/new-york-v4/ui/command.tsx'],['sidebar.tsx','apps/v4/registry/new-york-v4/ui/sidebar.tsx']]){const bytes=await fetchBytes('https://raw.githubusercontent.com/shadcn-ui/ui/'+commit+'/'+path);await writeFile(new URL(target,references),bytes);files[target]={path,sha256:digest(bytes)};}
const fontPath='ofl/geist/Geist[wght].ttf';
const fontCommit=JSON.parse((await fetchBytes('https://api.github.com/repos/google/fonts/commits?path='+encodeURIComponent(fontPath)+'&per_page=1')).toString())[0].sha;
const font=await fetchBytes('https://raw.githubusercontent.com/google/fonts/'+fontCommit+'/ofl/geist/Geist%5Bwght%5D.ttf'),license=await fetchBytes('https://raw.githubusercontent.com/google/fonts/'+fontCommit+'/ofl/geist/OFL.txt');
await writeFile(new URL('Geist.ttf',references),font);await writeFile(new URL('Geist-OFL.txt',references),license);
await writeFile(new URL('origin.json',references),JSON.stringify({shadcn:{repository:'https://github.com/shadcn-ui/ui',commit,license:'MIT',files,usage:'Grouped sidebar and command composition studied and reimplemented with existing vanilla DOM; no React runtime or upstream brand assets.'},geist:{repository:'https://github.com/google/fonts',commit:fontCommit,path:fontPath,sha256:digest(font),license:'SIL Open Font License 1.1',usage:'Unmodified locally bundled variable font; CJK uses installed system fallback.'},zed:{repository:'https://github.com/zed-industries/zed',usage:'Workspace panel hierarchy observed only; no source copied.'}},null,2)+'\n');
await writeFile(new URL('ADAPTATION.md',references),'# Inkvoy UI references\n\nPinned source and font hashes are in origin.json. The shadcn MIT command and sidebar sources were studied for keyboard-first navigation, grouping, and mobile/desktop composition. The local DOM implementation is in js/ui/v4/. Radix Colors and Motion mini are actual runtime dependencies with notices generated from installed packages. Geist is an unmodified OFL variable font served locally. Zed is a product-layout reference only; no Zed source or artwork is included.\n');
console.log(JSON.stringify({shadcnCommit:commit,fontCommit,fontBytes:font.length,files:Object.keys(files)}));
