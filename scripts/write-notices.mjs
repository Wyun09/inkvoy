import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
const project = new URL('../', import.meta.url);
const parts = ['# Third party components included in the Android JavaScript engine\n'];
const manifest=JSON.parse(await readFile(new URL('package.json',project),'utf8'));
const queue=Object.keys(manifest.dependencies||{}),included=new Set();
while(queue.length){const name=queue.shift();if(included.has(name))continue;included.add(name);
  const root = new URL(`node_modules/${name}/`, project);
  const info = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  queue.push(...Object.keys(info.dependencies||{}));
  let license;
  for (const filename of ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'LICENSE-MIT.txt', 'license', 'license.txt', 'LICENSE-MIT']) {
    try { license = await readFile(new URL(filename, root), 'utf8'); break; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!license) throw new Error('Missing third party license: ' + name);
  parts.push(`## ${name} ${info.version}\n\n${license}`);
}
parts.push(await readFile(new URL('third_party/RUNTIME_NOTICES.md',project),'utf8'));
parts.push(await readFile(new URL('third_party/termux-pty/LICENSE.txt',project),'utf8'));
parts.push('## assistant-ui Claude example and thread shell (adapted UI)\n\nSource: https://github.com/assistant-ui/assistant-ui/tree/e97f7c61365ef0f73686c7b596751802f1a1ddd2\n\n'+await readFile(new URL('third_party/assistant-ui/LICENSE',project),'utf8'));
parts.push('## shadcn/ui command and sidebar composition references\n\nPinned source and adaptation: third_party/ui-v4/origin.json and ADAPTATION.md\n\n'+await readFile(new URL('third_party/ui-v4/LICENSE.md',project),'utf8'));
parts.push('## Geist variable font\n\nUnmodified font from google/fonts; pinned source and SHA-256: third_party/ui-v4/origin.json\n\n'+await readFile(new URL('third_party/ui-v4/Geist-OFL.txt',project),'utf8'));
for(const file of (await readdir(new URL('third_party/licenses/',project))).sort())parts.push(`## ${file}\n\n`+await readFile(new URL('third_party/licenses/'+file,project),'utf8'));
const text = parts.join('\n\n') + '\n';
await mkdir(new URL('app/src/main/assets/', project), { recursive: true });
await writeFile(new URL('THIRD_PARTY_NOTICES.md', project), text);
await writeFile(new URL('app/src/main/assets/NOTICE.txt', project), text);
console.log('Included dependency licenses in source and APK assets.');
