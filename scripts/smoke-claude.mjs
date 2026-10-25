import http from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createEngine } from '../js/engine.js';

// Host-only compatibility smoke. This uses deterministic fixture replies and
// an isolated Claude config, never a real account/model or the user's settings.
const root = resolve(process.argv[2] || '../../work/claude-bridge-smoke-' + Date.now());
const workspace = resolve(root, 'workspace'), config = resolve(root, 'claude-config');
await mkdir(workspace, { recursive: true }); await mkdir(config, { recursive: true });
const target = resolve(workspace, 'bridge-client-smoke.txt');
const expected = 'BRIDGE_CLAUDE_OK';
const pending = new Map(), requests = []; let observedSchemas = [];
let sequence = 0, toolResponses = 0, resultObserved = false;
let fixtureChats = 0, reusedCalls = 0;
const webpages = new Map();
const backend = { async *generate({ prompt, conversation }) {
  const reused = conversation?.reuse && webpages.has(conversation.path);
  const path = reused ? conversation.path : '/a/chat/s/client-fixture-' + ++fixtureChats;
  const state = webpages.get(path) || { tools: [], turns: 0 };
  if (reused) reusedCalls++;
  const historyText = /<conversation_json>\n([\s\S]*?)\n<\/conversation_json>/.exec(prompt)?.[1];
  const toolsText = /<available_tools_json>\n([\s\S]*?)\n<\/available_tools_json>/.exec(prompt)?.[1];
  const history = historyText ? JSON.parse(historyText) : [], tools = toolsText ? JSON.parse(toolsText) : state.tools;
  state.tools = tools; state.turns++; webpages.set(path, state);
  const hasWrite = tools.some(tool => tool.name === 'Write');
  if (hasWrite && !history.some(message => message.role === 'tool')) {
    toolResponses++;
    yield { type: 'text', delta: JSON.stringify({ tool_calls: [{ name: 'Write', arguments: { file_path: target, content: expected } }] }) };
  } else {
    if (history.some(message => message.role === 'tool')) resultObserved = true;
    yield { type: 'text', delta: tools.length ? JSON.stringify({ status: 'complete', content: 'Verified the tool result. ' + expected }) : expected };
  }
  yield { type: 'done', conversation: { path, answerCount: state.turns, lastAnswer: 'fixture-' + state.turns }, reused };
} };
const engine = createEngine(backend, (id, kind, payload) => {
  const response = pending.get(id); if (!response) return;
  if (kind === 'response') { response.writeHead(payload.status, { 'content-type': 'application/json' }); response.end(JSON.stringify(payload.body)); pending.delete(id); }
  if (kind === 'stream') { response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }); response.flushHeaders(); }
  if (kind === 'data') response.write(payload.text);
  if (kind === 'end') { response.end(); pending.delete(id); }
});
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  if (request.method === 'HEAD' || request.method === 'GET') { response.writeHead(200, { 'content-type': 'application/json' }); return response.end('{}'); }
  const credential = request.headers.authorization === 'Bearer local-protocol-fixture-only' || request.headers['x-api-key'] === 'local-protocol-fixture-only';
  if (!credential) { response.writeHead(401); return response.end(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'Local test token required.' } })); }
  let raw = '';
  for await (const chunk of request) { raw += chunk; if (raw.length > 16 * 1024 * 1024) { response.writeHead(413); return response.end(); } }
  const body = JSON.parse(raw), id = 'cli-' + ++sequence;
  observedSchemas = (body.tools || []).map(tool => ({ name: tool.name, input_schema: tool.input_schema }));
  requests.push({ path: url.pathname, model: body.model, toolNames: (body.tools || []).map(tool => tool.name), stream: body.stream === true, hasToolResult: JSON.stringify(body.messages || []).includes('tool_result') });
  pending.set(id, response); response.on('close', () => { if (!response.writableEnded) engine.cancel(id); });
  engine.receive({ id, path: url.pathname, body });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const env = { ...process.env, CLAUDE_CONFIG_DIR: config, ANTHROPIC_BASE_URL: `http://127.0.0.1:${server.address().port}`, ANTHROPIC_AUTH_TOKEN: 'local-protocol-fixture-only',
  ANTHROPIC_MODEL: 'deepseek-web', ANTHROPIC_DEFAULT_SONNET_MODEL: 'deepseek-web', ANTHROPIC_DEFAULT_OPUS_MODEL: 'deepseek-web', ANTHROPIC_DEFAULT_HAIKU_MODEL: 'deepseek-web',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1', CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1', CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' };
for (const name of ['ANTHROPIC_API_KEY','CLAUDE_CODE_OAUTH_TOKEN','CLAUDE_CODE_USE_BEDROCK','CLAUDE_CODE_USE_VERTEX','CLAUDE_CODE_USE_FOUNDRY','CLAUDE_CODE_USE_MANTLE','CLAUDECODE']) delete env[name];
const args = ['-p', 'Use the Write tool to create bridge-client-smoke.txt containing exactly BRIDGE_CLAUDE_OK. After the real tool result, report completion.', '--model', 'deepseek-web', '--tools', 'Write', '--allowedTools', 'Write', '--permission-mode', 'acceptEdits', '--max-turns', '3', '--output-format', 'json', '--no-session-persistence', '--disable-slash-commands'];
let stdout = '', stderr = '', code;
try {
  const command = process.env.CLAUDE_TEST_BINARY || (process.platform === 'win32'
    ? resolve(process.env.APPDATA, 'npm/node_modules/@anthropic-ai/claude-code/bin/claude.exe') : 'claude');
  const child = spawn(command, args, { cwd: workspace, env, shell: false, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
  child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
  const timer = setTimeout(() => child.kill(), 90000);
  code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); }); clearTimeout(timer);
} finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
let contents = ''; try { contents = await readFile(target, 'utf8'); } catch {}
const result = { pass: code === 0 && contents === expected && resultObserved && fixtureChats === 1 && reusedCalls >= 1, exitCode: code, requests, toolResponses, actualFileMatches: contents === expected, toolResultReturned: resultObserved,
  conversationReuse: { fixtureChats, reusedCalls, singleConversation: fixtureChats === 1 },
  mode: 'installed Claude Code against the production JS protocol engine with deterministic model fixtures; not an Android/real-account test' };
await writeFile(resolve(root,'result.json'), JSON.stringify(result,null,2)+'\n');
if (!result.pass) await writeFile(resolve(root,'tool-schemas.json'), JSON.stringify(observedSchemas,null,2)+'\n');
console.log(JSON.stringify(result));
if (!result.pass) { console.error((stderr + '\n' + stdout).slice(-6000)); process.exitCode = 1; }
