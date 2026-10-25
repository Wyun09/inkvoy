import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const modules = {};
for (const name of ['protocol.js', 'browser.js', 'dom-text.js', 'streaming.js', 'usage.js']) {
  const source = await readFile(new URL('../deepseek-web-bridge/src/' + name, root));
  const local = await readFile(new URL('js/core/' + name, root));
  modules[name] = { sourceSha256: digest(source), localSha256: digest(local), unchanged: source.equals(local) };
}
const extension = 'reasoning-control.js';
await writeFile(new URL('CORE_PROVENANCE.json', root), JSON.stringify({ source: 'deepseek-web-bridge v0.2.2', method: 'four unchanged modules; browser.js has the documented Android reasoning-control adaptation', modules,
  extensions: { [extension]: digest(await readFile(new URL('js/core/' + extension, root))) },
  browserPatch: ['DOM reader supports mobile state attributes, component classes, tabs and native checkbox controls.', 'Mode switch selects and clicks atomically, then confirms the observed final state.', 'Unknown, contradictory and ambiguous state remains an explicit error.'] }, null, 2) + '\n');
console.log(JSON.stringify({ unchanged: Object.values(modules).filter(item => item.unchanged).length, adapted: Object.values(modules).filter(item => !item.unchanged).length, extensions: 1 }));
