import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
const destination = new URL('../test/', import.meta.url);
const source = new URL('../../deepseek-web-bridge/test/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const name of ['protocol', 'streaming', 'dom-text', 'usage', 'browser']) {
  const text = await readFile(new URL(`${name}.test.js`, source), 'utf8');
  await writeFile(new URL(`core-${name}.test.mjs`, destination), text.replaceAll("'../src/", "'../js/core/"));
}
await cp(new URL('fixtures/', source), new URL('fixtures/', destination), { recursive: true });
console.log('Copied five existing core test suites with mobile import paths.');
