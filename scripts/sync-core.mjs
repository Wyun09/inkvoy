import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const destination = new URL('../js/core/', import.meta.url);
const source = new URL('../../deepseek-web-bridge/src/', import.meta.url);
await mkdir(destination, { recursive: true });
const hashes = {};
for (const name of ['protocol.js', 'browser.js', 'dom-text.js', 'streaming.js', 'usage.js']) {
  const bytes = await readFile(new URL(name, source));
  await writeFile(new URL(name, destination), bytes);
  hashes[name] = createHash('sha256').update(bytes).digest('hex');
}
await writeFile(new URL('../CORE_PROVENANCE.json', import.meta.url), JSON.stringify({ source: 'deepseek-web-bridge v0.2.2', method: 'unchanged source copy; browser platform imports supplied by build-time shims', sha256: hashes }, null, 2) + '\n');
console.log('Copied five unchanged core modules.');
