import { readFile, writeFile, mkdir } from 'node:fs/promises';
const project = new URL('../', import.meta.url);
const parts = ['# Third party components included in the Android JavaScript engine\n'];
for (const name of ['ajv', 'fast-deep-equal', 'fast-uri', 'json-schema-traverse', 'require-from-string']) {
  const root = new URL(`node_modules/${name}/`, project);
  const info = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  let license;
  for (const filename of ['LICENSE', 'LICENSE.txt', 'license', 'license.txt']) {
    try { license = await readFile(new URL(filename, root), 'utf8'); break; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!license) throw new Error('Missing third party license: ' + name);
  parts.push(`## ${name} ${info.version}\n\n${license}`);
}
const text = parts.join('\n\n') + '\n';
await mkdir(new URL('app/src/main/assets/', project), { recursive: true });
await writeFile(new URL('THIRD_PARTY_NOTICES.md', project), text);
await writeFile(new URL('app/src/main/assets/NOTICE.txt', project), text);
console.log('Included dependency licenses in source and APK assets.');
