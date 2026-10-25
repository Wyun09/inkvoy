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
await writeFile(new URL('CORE_PROVENANCE.json', root), JSON.stringify({ source: 'deepseek-web-bridge v0.2.2', method: 'three unchanged modules; browser.js has Android toggle/submission hooks; protocol.js selects the declared JSON Schema dialect', modules,
  extensions: { [extension]: digest(await readFile(new URL('js/core/' + extension, root))) },
  platformExtensions: Object.fromEntries(await Promise.all(['js/send-control.js', 'js/anthropic.js'].map(async path => [path, digest(await readFile(new URL(path, root)))]))),
  protocolPatch: ['Select Ajv draft-07, draft-2019-09 or draft-2020-12 from the tool schema declaration.', 'Keep schema keywords and validate real tool arguments; do not strip the declared dialect.'],
  browserPatch: ['DOM reader supports mobile state attributes, component classes, tabs and native checkbox controls.', 'Thinking/search mode switches confirm the observed final state.', 'Android submission hook clicks one verified send control; default desktop Enter contract is retained in the shared class.', 'A state read ending at the submission deadline reports unconfirmed submission consistently, without resubmission.', 'Unknown, contradictory and ambiguous state remains an explicit error.'] }, null, 2) + '\n');
console.log(JSON.stringify({ unchanged: Object.values(modules).filter(item => item.unchanged).length, adapted: Object.values(modules).filter(item => !item.unchanged).length, extensions: 3 }));
