import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { TaskLedger } from '../js/tasks.js';
import { createEngine } from '../js/engine.js';
import { ConversationPool } from '../js/conversations.js';
import { prepareRequest, parseToolResponse } from '../js/core/protocol.js';

const body = (extra = {}) => ({ model: 'deepseek-web', messages: [{ role: 'user', content: 'Inspect fixture.txt' }], ...extra });
const tools = [{ type: 'function', function: { name: 'Read', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false } } }];
const handle = { path: '/a/chat/s/persistent-fixture', lastAnswer: 'fixture-answer', answerCount: 1 };
let harnessSequence = 0;
function harness(generate, options = {}) {
  const pending = new Map(), all = [];
  let sequence = 0; const prefix = ++harnessSequence;
  const backend = { generate, openSavedSession: async value => { backend.opened = value; } };
  const engine = createEngine(backend, (id, kind, payload) => {
    const frames = pending.get(id); all.push({ id, kind, payload });
    if (frames) { frames.push({ kind, payload }); if (kind === 'response' || kind === 'end') { frames.resolve(frames); pending.delete(id); } }
  }, { timeoutMs: 2000, heartbeatMs: 500, ...options });
  function call(input = body(), path = '/v1/chat/completions', extra = {}) {
    const id = 'fixture-' + prefix + '-' + ++sequence, frames = [];
    const promise = new Promise(resolve => { frames.resolve = resolve; }); pending.set(id, frames);
    engine.receive({ id, path, body: input, ...extra }); return promise;
  }
  return { engine, backend, call, all };
}
const response = frames => frames.find(frame => frame.kind === 'response')?.payload;
function job(id = 'one') { return { id, path: '/v1/chat/completions', body: body() }; }

test('strict Agent completion rejects progress, permits genuine tool requests and explicit needs_input', () => {
  const request = prepareRequest(body({ tools }), 'deepseek-web', { strictAgent: true });
  assert.match(request.prompt, /Never mark a promise/);
  for (const output of ['{"content":"I will inspect the file."}', '{"status":"progress","content":"Still checking"}', '{"status":"complete","tool_calls":[{"name":"Read","arguments":{"path":"x"}}]}']) assert.throws(() => parseToolResponse(output, request), error => error.code === 'invalid_tool_response');
  assert.equal(parseToolResponse('{"status":"needs_input","content":"Which file?"}', request).agentStatus, 'needs_input');
  assert.equal(parseToolResponse('{"status":"complete","content":"Verified."}', request).agentStatus, 'complete');
  assert.equal(parseToolResponse('{"status":"tool","tool_calls":[{"name":"Read","arguments":{"path":"x"}}]}', request).finishReason, 'tool_calls');
});

test('strict production engine repairs a progress-only reply once, compatible override accepts legacy finals', async () => {
  let attempts = 0;
  const h = harness(async function* () { attempts++; yield { type: 'text', delta: '{"content":"I will inspect the files."}' }; });
  const strict = response(await h.call(body({ tools })));
  assert.equal(attempts, 2); assert.equal(strict.status, 502); assert.equal(strict.body.error.code, 'invalid_tool_response');
  const compatible = response(await h.call(body({ tools, bridge_agent_mode: 'compatible' })));
  assert.equal(compatible.status, 200); assert.equal(attempts, 3);
  assert.ok(h.engine.snapshot().tasks.some(task => task.state === 'failed'));
});

test('task phases and completion markers expose waiting tools and waiting user without false completion', async () => {
  let call = 0;
  const h = harness(async function* ({ onPhase }) {
    onPhase('submitting'); call++;
    yield { type: 'text', delta: call === 1 ? '{"tool_calls":[{"name":"Read","arguments":{"path":"fixture.txt"}}]}' : '{"status":"needs_input","content":"Need a filename"}' };
  });
  await h.call(body({ tools })); const first = h.engine.snapshot().tasks[0];
  assert.equal(first.state, 'waiting_tools'); assert.equal(first.toolsOffered, 1); assert.equal(first.cancelAvailable, false);
  assert.ok(first.events.some(event => event.phase === 'submitting'));
  await h.call(body({ tools, messages: [{ role: 'user', content: 'Independent question' }] }));
  assert.equal(h.engine.snapshot().tasks[0].state, 'waiting_user');
});

test('validated history restores the same task and webpage handle across engine restarts', async () => {
  let saved;
  const initial = harness(async function* () { yield { type: 'text', delta: 'first answer' }; yield { type: 'done', conversation: handle }; }, { saveState: value => { saved = structuredClone(value); } });
  const first = response(await initial.call()).body.choices[0].message, taskId = initial.engine.snapshot().tasks[0].id;
  initial.engine.saveState();
  let seen;
  const resumed = harness(async function* (request) { seen = request; yield { type: 'text', delta: 'second answer' }; yield { type: 'done', conversation: handle, reused: true }; }, { initialState: saved });
  const next = body({ messages: [...body().messages, first, { role: 'user', content: 'Continue from verified state' }] });
  assert.equal(response(await resumed.call(next)).status, 200);
  assert.equal(seen.conversation.reuse, true); assert.equal(seen.conversation.path, handle.path);
  assert.ok(seen.prompt.includes('Continue from verified state')); assert.ok(!seen.prompt.includes('Inspect fixture.txt'));
  assert.equal(resumed.engine.snapshot().tasks.length, 1); assert.equal(resumed.engine.snapshot().tasks[0].id, taskId); assert.equal(resumed.engine.snapshot().tasks[0].requestCount, 2);
  assert.equal(resumed.engine.snapshot().sessions[0].turns, 2);
});

test('saved associations with invalid paths or digests are rejected before browser navigation', () => {
  const base = { length: 2, digest: 'a'.repeat(64), toolsHash: 'b'.repeat(64), handle };
  const pool = new ConversationPool({ saved: { records: [base, { ...base, handle: { ...handle, path: 'https://evil.example/' } }, { ...base, digest: 'invalid' }] } });
  assert.equal(pool.summaries().length, 1);
});

test('restored running requests become interrupted without automatic generation, completed tools never become retryable', () => {
  const ledger = new TaskLedger(), active = job('active'); ledger.create(active, 'OpenAI'); ledger.phase(active, 'submitting');
  const toolJob = job('tool'); ledger.create(toolJob, 'OpenAI'); ledger.offerTools(toolJob, 1); ledger.finish(toolJob, { message: { tool_calls: [{ id: 'stable-id' }] } }, {});
  const restored = new TaskLedger(ledger.serialize()), snapshot = restored.snapshot();
  const interrupted = snapshot.tasks.find(task => task.id === active.taskId), waiting = snapshot.tasks.find(task => task.id === toolJob.taskId);
  assert.equal(interrupted.state, 'interrupted'); assert.equal(interrupted.activeRequestId, null); assert.ok(restored.retryInput(active.taskId));
  assert.equal(waiting.state, 'waiting_tools'); assert.equal(restored.retryInput(toolJob.taskId), null);
});

for (const stream of [false, true]) test(`idempotent ${stream ? 'SSE' : 'JSON'} tool responses replay exact frames and call IDs without another generation`, async () => {
  let calls = 0, saved;
  const h = harness(async function* () { calls++; yield { type: 'text', delta: '{"tool_calls":[{"name":"Read","arguments":{"path":"fixture.txt"}}]}' }; }, { saveState: value => { saved = structuredClone(value); } });
  const input = body({ tools, stream }), first = await h.call(input, undefined, { requestKey: 'operation-123' }); h.engine.saveState();
  const afterRestart = harness(async function* () { calls++; throw new Error('must not regenerate'); }, { initialState: saved });
  const second = await afterRestart.call(input, undefined, { requestKey: 'operation-123' });
  assert.deepEqual([...second], [...first]); assert.equal(calls, 1);
  assert.equal(afterRestart.engine.snapshot().tasks[0].state, 'waiting_tools');
  assert.ok(afterRestart.engine.snapshot().tasks[0].events.some(event => event.phase === 'replayed'));
  assert.ok(!JSON.stringify(saved).includes('operation-123'), 'Only hashes of idempotency keys persist');
});

test('same idempotency key with changed content is a conflict before another webpage submission', async () => {
  let calls = 0; const h = harness(async function* () { calls++; yield { type: 'text', delta: 'ok' }; });
  await h.call(body(), undefined, { requestKey: 'same-key' });
  const conflict = response(await h.call(body({ messages: [{ role: 'user', content: 'different' }] }), undefined, { requestKey: 'same-key' }));
  assert.equal(conflict.status, 409); assert.equal(conflict.body.error.code, 'idempotency_conflict'); assert.equal(calls, 1);
});

test('running keyed requests conflict and evicted tool results never trigger regeneration', async () => {
  const ledger = new TaskLedger(), first = job('a'); ledger.create(first, 'OpenAI');
  assert.equal(await ledger.idempotency(first, 'one'), null); ledger.phase(first, 'submitting');
  const second = job('b'); ledger.create(second, 'OpenAI'); assert.equal((await ledger.idempotency(second, 'one')).error, 'request_in_progress');
  ledger.offerTools(first, 1); ledger.finish(first, { message: { tool_calls: [{}] } }, {});
  assert.equal((await ledger.idempotency(second, 'one')).error, 'request_result_unavailable');
});

test('replaying an older tool result preserves a later completed task and its latest response', async () => {
  let calls = 0;
  const h = harness(async function* () { calls++; yield { type: 'text', delta: calls === 1 ? '{"tool_calls":[{"name":"Read","arguments":{"path":"fixture.txt"}}]}' : '{"status":"complete","content":"verified final answer"}' }; yield { type: 'done', conversation: handle, reused: calls > 1 }; });
  const input = body({ tools }), first = response(await h.call(input, undefined, { requestKey: 'old-tool-key' })).body.choices[0].message;
  const next = body({ tools, messages: [...input.messages, first, { role: 'tool', tool_call_id: first.tool_calls[0].id, content: 'actual fixture contents' }] });
  await h.call(next); const task = h.engine.snapshot().tasks[0], latestId = task.lastRequestId;
  await h.call(input, undefined, { requestKey: 'old-tool-key' });
  assert.equal(calls, 2); assert.equal(h.engine.snapshot().tasks[0].state, 'completed'); assert.equal(h.engine.snapshot().tasks[0].lastRequestId, latestId);
  assert.match(JSON.stringify(h.engine.taskResult(task.id)), /verified final answer/);
});

test('cancel API reports cancellation and text retry uses the cached original input in the same task', async () => {
  let calls = 0;
  const h = harness(async function* ({ signal }) { if (++calls === 1) { await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })); } yield { type: 'text', delta: 'recovered' }; });
  const first = h.call(); await delay(10); const taskId = h.engine.snapshot().tasks[0].id;
  const cancelled = response(await h.call({}, '/v1/bridge/tasks/' + taskId + '/cancel')); assert.equal(cancelled.body.cancelled, true);
  assert.equal(response(await first).status, 499); assert.equal(h.engine.snapshot().tasks[0].state, 'cancelled');
  const retried = response(await h.call({}, '/v1/bridge/tasks/' + taskId + '/retry')); assert.equal(retried.body.choices[0].message.content, 'recovered');
  assert.equal(h.engine.snapshot().tasks.length, 1); assert.equal(h.engine.snapshot().tasks[0].requestCount, 2);
  const saved = response(await h.call({}, '/v1/bridge/tasks/' + taskId + '/result')); assert.ok(saved.body.frames.length);
});

test('tool task retries require the original client; login blockers are visible without repeated generation', async () => {
  const h = harness(async function* () { throw Object.assign(new Error('Manual login required'), { code: 'LOGIN_REQUIRED', status: 401 }); });
  await h.call(body({ tools })); const task = h.engine.snapshot().tasks[0];
  assert.equal(task.state, 'blocked'); assert.equal(task.localRetryAvailable, false); assert.equal(task.retryAvailable, true); assert.equal(h.engine.retryTask(task.id), false);
});

test('large retry inputs are evicted whole, bounded task records do not truncate a prompt', () => {
  const ledger = new TaskLedger({}, { max: 3 });
  for (let i = 0; i < 5; i++) { const item = job('large-' + i); item.body.messages[0].content = 'x'.repeat(1100000); ledger.create(item, 'OpenAI'); ledger.fail(item, { code: 'fixture_error', message: 'failed' }); }
  assert.equal(ledger.snapshot().tasks.length, 3); assert.equal(ledger.snapshot().totalRequests, 5);
  assert.ok([...ledger.requests.values()].every(request => !request.input)); assert.ok(ledger.snapshot().tasks.every(task => !task.retryAvailable));
});

test('task metadata exports no full inputs or frames, redacts common keys and phone numbers from titles', () => {
  const ledger = new TaskLedger(), item = job(); item.body.messages[0].content = 'android-' + 'f'.repeat(64) + ' 13800138000'; ledger.create(item, 'OpenAI');
  ledger.cache(item, [{ kind: 'response', payload: { body: { text: 'PRIVATE_RESULT' } } }]);
  const snapshot = JSON.stringify(ledger.snapshot()); assert.ok(!snapshot.includes('android-')); assert.ok(!snapshot.includes('13800138000')); assert.ok(!snapshot.includes('PRIVATE_RESULT')); assert.ok(!snapshot.includes('messages'));
});

test('JSON object key order does not turn an otherwise identical keyed request into a conflict', async () => {
  const ledger = new TaskLedger(), first = job('first'); ledger.create(first, 'OpenAI'); await ledger.idempotency(first, 'ordered');
  ledger.finish(first, { message: { content: 'ok' } }, {}); ledger.cache(first, [{ kind: 'response', payload: { status: 200, body: { content: 'ok' } } }]);
  const second = { id: 'second', path: first.path, body: { messages: [{ content: 'Inspect fixture.txt', role: 'user' }], model: 'deepseek-web' } }; ledger.create(second, 'OpenAI');
  assert.ok((await ledger.idempotency(second, 'ordered')).replay);
});

test('native Anthropic streaming replay preserves block lifecycle and tool_use IDs without double conversion', async () => {
  let calls = 0;
  const h = harness(async function* () { calls++; yield { type: 'text', delta: '{"tool_calls":[{"name":"Read","arguments":{"path":"fixture.txt"}}]}' }; });
  const input = { model: 'deepseek-web', max_tokens: 256, messages: body().messages, tools: [{ name: 'Read', input_schema: tools[0].function.parameters }], stream: true };
  const first = await h.call(input, '/v1/messages', { requestKey: 'anthropic-tool' });
  const replay = await h.call(input, '/v1/messages', { requestKey: 'anthropic-tool' });
  assert.equal(calls, 1); assert.deepEqual([...replay], [...first]);
  assert.match(first.filter(frame => frame.kind === 'data').map(frame => frame.payload.text).join(''), /tool_use/);
});

test('service cancellation stops active and queued work without starting a second webpage generation', async () => {
  let calls = 0;
  const h = harness(async function* ({ signal }) { calls++; await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })); });
  const first = h.call(); await delay(10); const second = h.call(); h.engine.cancelAll();
  assert.equal(response(await first).status, 499); assert.equal(response(await second).status, 499); assert.equal(calls, 1);
  assert.ok(h.engine.snapshot().tasks.every(task => task.state === 'cancelled'));
});
