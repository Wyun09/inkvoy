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
await writeFile(new URL('CORE_PROVENANCE.json', root), JSON.stringify({ source: 'deepseek-web-bridge v0.2.2', method: 'two unchanged modules; browser.js has Android conversation/toggle/submission/phase hooks; protocol.js adds schema dialects, normalized history and strict Agent completion; dom-text.js isolates the current turn', modules,
  extensions: { [extension]: digest(await readFile(new URL('js/core/' + extension, root))) },
  platformExtensions: Object.fromEntries(await Promise.all(['js/send-control.js', 'js/anthropic.js', 'js/conversations.js', 'js/conversation-dom.js', 'js/tasks.js'].map(async path => [path, digest(await readFile(new URL(path, root)))]))),
  domTextPatch: ['Exclude fingerprint-checked historical answers, old thinking and old completion controls from each new turn.', 'Restore markers after a matching DOM re-render; reject changed/missing history instead of mixing responses.'],
  timeoutPatch: ['Recheck wall time when a timer fires so a rounded/early tick cannot expire a request ahead of its deadline.', 'Classify total deadlines versus observation budgets from the selected budget, not an incidental clock read.'],
  protocolPatch: ['Select Ajv draft-07, draft-2019-09 or draft-2020-12 from the tool schema declaration.', 'Keep schema keywords and validate real tool arguments; do not strip the declared dialect.', 'Strict tool mode requires explicit complete/needs_input for content-only replies and rejects final statuses containing tool calls.'],
  persistencePatch: ['Restore bounded fingerprinted conversation associations after checking their paths and structure.', 'Keep bounded task and request records with exact protocol result frames and hashed idempotency keys.', 'Never auto-run restored interrupted work; tool execution remains owned by the calling client.'],
  browserPatch: ['DOM reader supports mobile state attributes, component classes, tabs and native checkbox controls.', 'Thinking/search mode switches confirm the observed final state.', 'Android submission hook clicks one verified send control; default desktop Enter contract is retained in the shared class.', 'A state read ending at the submission deadline reports unconfirmed submission consistently, without resubmission.', 'Unknown, contradictory and ambiguous state remains an explicit error.'] }, null, 2) + '\n');
console.log(JSON.stringify({ unchanged: Object.values(modules).filter(item => item.unchanged).length, adapted: Object.values(modules).filter(item => !item.unchanged).length, extensions: 6 }));
