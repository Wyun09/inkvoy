import test from 'node:test';
import assert from 'node:assert/strict';
import { ConversationPool } from '../js/conversations.js';
import { prepareRequest } from '../js/core/protocol.js';
import { createEngine } from '../js/engine.js';

const user = text => ({ role: 'user', content: text });
const answer = text => ({ role: 'assistant', content: text });
const body = (messages, extra = {}) => ({ model: 'deepseek-web', messages, ...extra });
const handle = (n = 1) => ({ path: '/a/chat/s/task-' + n, answerCount: 1, lastAnswer: 'fixture-' + n });
const tool = { type: 'function', function: { name: 'Read', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } };

test('a task follow-up reuses only after matching the complete validated history', async () => {
  const pool = new ConversationPool(), input = body([user('PRIVATE_TASK')]);
  await pool.commit(await pool.plan(input), answer('PRIVATE_ANSWER'), handle(), false);
  const next = await pool.plan(body([user('PRIVATE_TASK'), answer('PRIVATE_ANSWER'), user('Next')]));
  assert.equal(next.reuse, true); assert.equal(next.offset, 2);
  const prompt = pool.continuation(prepareRequest(body([user('PRIVATE_TASK'), answer('PRIVATE_ANSWER'), user('Next')]), 'deepseek-web'), next);
  assert.ok(prompt.includes('Next')); assert.ok(!prompt.includes('PRIVATE_TASK')); assert.ok(!prompt.includes('PRIVATE_ANSWER'));
  assert.ok(!JSON.stringify([...pool.records.values()]).includes('PRIVATE_'));
});

test('identical first questions, edited history and different system instructions never merge tasks', async () => {
  const pool = new ConversationPool();
  const initial = body([{ role: 'system', content: 'policy A' }, user('hello')]);
  await pool.commit(await pool.plan(initial), answer('ok'), handle(), false);
  assert.equal((await pool.plan(initial)).reuse, false);
  assert.equal((await pool.plan(body([{ role: 'system', content: 'policy B' }, user('hello'), answer('ok'), user('next')]))).reuse, false);
  assert.equal((await pool.plan(body([...initial.messages, answer('edited'), user('next')]))).reuse, false);
});

test('two identical independent histories remain ambiguous instead of choosing an arbitrary task', async () => {
  const pool = new ConversationPool();
  for (let n = 1; n <= 2; n++) await pool.commit(await pool.plan(body([user('same question')])), answer('same answer'), handle(n), false);
  const plan = await pool.plan(body([user('same question'), answer('same answer'), user('next')]));
  assert.equal(plan.reuse, false); assert.equal(plan.reason, 'ambiguous_history');
});

test('tool IDs, argument meaning and text blocks normalize across client representations', async () => {
  const pool = new ConversationPool(), first = body([user('read')], { tools: [tool] });
  const call = { role: 'assistant', content: null, tool_calls: [{ id: 'call_real', type: 'function', function: { name: 'Read', arguments: '{"path":"a","x":1}' } }] };
  await pool.commit(await pool.plan(first), call, handle(), false);
  const historical = { ...call, content: [], tool_calls: [{ ...call.tool_calls[0], function: { name: 'Read', arguments: '{"x":1,"path":"a"}' } }] };
  const next = body([{ role: 'user', content: [{ type: 'text', text: 'read' }] }, historical, { role: 'tool', tool_call_id: 'call_real', content: 'REAL_RESULT' }], { tools: [tool] });
  assert.equal((await pool.plan(next)).reuse, true);
  next.messages[1].tool_calls[0].id = 'another_call';
  assert.equal((await pool.plan(next)).reuse, false);
});

test('interleaved tasks recover their own webpage handles', async () => {
  const pool = new ConversationPool();
  for (const [n, text] of [[1, 'A'], [2, 'B']]) await pool.commit(await pool.plan(body([user(text)])), answer(text + '-answer'), handle(n), false);
  assert.equal((await pool.plan(body([user('A'), answer('A-answer'), user('A-next')]))).record.handle.path, handle(1).path);
  assert.equal((await pool.plan(body([user('B'), answer('B-answer'), user('B-next')]))).record.handle.path, handle(2).path);
});

test('explicit conversation IDs isolate matching histories and targeted reset keeps other tasks', async () => {
  const pool = new ConversationPool();
  for (const id of ['A', 'B']) await pool.commit(await pool.plan(body([user('same')], { conversation_id: id })), answer('ok'), handle(id), false);
  const messages = [user('same'), answer('ok'), user('next')];
  assert.equal((await pool.plan(body(messages, { conversation_id: 'C' }))).reuse, false);
  assert.equal((await pool.plan(body(messages, { conversation_id: 'A', reset_conversation: true }))).reuse, false);
  assert.equal((await pool.plan(body(messages, { conversation_id: 'B' }))).reuse, true);
});

test('pool bounds session metadata and global reset only drops local associations', async () => {
  const pool = new ConversationPool({ max: 2 });
  for (let n = 1; n <= 3; n++) await pool.commit(await pool.plan(body([user('task' + n)])), answer('ok'), handle(n), false);
  assert.equal(pool.state().tracked, 2);
  assert.equal((await pool.plan(body([user('task1'), answer('ok'), user('next')]))).reuse, false);
  pool.reset(); assert.equal(pool.state().tracked, 0); assert.equal(pool.state().lastAction, 'reset');
});

test('unchanged tool schemas are omitted from continuations while changed schemas are sent', async () => {
  const pool = new ConversationPool();
  await pool.commit(await pool.plan(body([user('task')], { tools: [tool] })), answer('ok'), handle(), false);
  for (const changed of [false, true]) {
    const next = body([user('task'), answer('ok'), user('next')], { tools: [{ ...tool, function: { ...tool.function, ...(changed ? { description: 'NEW_DESCRIPTION' } : {}) } }] });
    const plan = await pool.plan(next), prompt = pool.continuation(prepareRequest(next, 'deepseek-web'), plan);
    assert.equal(plan.reuse, true); assert.equal(prompt.includes('<available_tools_json>'), changed);
    if (!changed) assert.ok(prompt.includes('UNCHANGED'));
  }
});

function harness(generate, options = {}) {
  const frames = new Map(); let sequence = 0;
  const engine = createEngine({ generate }, (id, kind, payload) => { const pending = frames.get(id); pending.events.push({ kind, payload }); if (kind === 'response' || kind === 'end') pending.resolve(pending.events); }, options);
  const submit = input => new Promise(resolve => { const id = String(++sequence); frames.set(id, { events: [], resolve }); engine.receive({ id, path: '/v1/chat/completions', body: input }); });
  return { engine, submit };
}

test('manual reset cannot discard associations while the engine has active work', async () => {
  const h = harness(async function* () { yield { type: 'text', delta: 'ok' }; yield { type: 'done', conversation: handle() }; });
  const pending = h.submit(body([user('task')])); assert.equal(h.engine.resetConversations(), false);
  await pending; assert.equal(h.engine.resetConversations(), true); assert.equal(h.engine.conversationState().tracked, 0);
});

test('production engine reuses a validated tool turn, sends only results, and keeps tool IDs', async () => {
  const calls = [];
  const h = harness(async function* (request) {
    calls.push(request);
    yield { type: 'text', delta: calls.length === 1 ? JSON.stringify({ tool_calls: [{ name: 'Read', arguments: { path: 'real.txt' } }] }) : JSON.stringify({ content: 'done' }) };
    yield { type: 'done', conversation: handle(), reused: calls.length > 1 };
  });
  const first = (await h.submit(body([user('TASK_ONLY_ONCE')], { tools: [tool] })))[0].payload.body.choices[0].message;
  const second = (await h.submit(body([user('TASK_ONLY_ONCE'), first, { role: 'tool', tool_call_id: first.tool_calls[0].id, content: 'REAL_TOOL_RESULT' }], { tools: [tool] })))[0];
  assert.equal(second.payload.status, 200); assert.equal(calls[1].conversation.reuse, true);
  assert.ok(calls[1].prompt.includes('REAL_TOOL_RESULT')); assert.ok(!calls[1].prompt.includes('TASK_ONLY_ONCE'));
  assert.ok(!calls[1].prompt.includes('<available_tools_json>')); assert.equal(h.engine.conversationState().reused, 1);
  assert.equal(h.engine.conversationState().created, 1);
});

test('only new images are uploaded on reuse and full history remains available for recovery', async () => {
  const calls = [];
  const h = harness(async function* (request) { calls.push(request); yield { type: 'text', delta: 'ok' }; yield { type: 'done', conversation: handle(), reused: calls.length > 1 }; });
  const image = name => ({ type: 'image_url', image_url: { url: 'data:image/png;base64,' + name } });
  const initial = { role: 'user', content: [{ type: 'text', text: 'old' }, image('AQID')] };
  await h.submit(body([initial]));
  await h.submit(body([initial, answer('ok'), { role: 'user', content: [{ type: 'text', text: 'new' }, image('BAUG')] }]));
  assert.equal(calls[1].images.length, 1); assert.equal(calls[1].images[0].buffer.toString('base64'), 'BAUG');
  assert.equal(calls[1].conversation.fullImages.length, 2); assert.ok(calls[1].conversation.fullPrompt.includes('old'));
  assert.ok(!calls[1].prompt.includes('"text":"old"'));
});

test('completed malformed envelopes repair in the same chat without dispatching rejected tools', async () => {
  const calls = [];
  const h = harness(async function* (request) {
    calls.push(request); yield { type: 'text', delta: calls.length === 1 ? '{"bad":true}' : '{"content":"done"}' };
    yield { type: 'done', conversation: handle(), reused: calls.length > 1 };
  });
  const response = (await h.submit(body([user('task')], { tools: [tool] })))[0];
  assert.equal(response.payload.status, 200); assert.equal(calls.length, 2); assert.equal(calls[1].conversation.reuse, true);
  assert.ok(calls[1].prompt.includes('SAME conversation')); assert.ok(!calls[1].prompt.includes('<conversation_json>'));
  assert.equal(h.engine.conversationState().created, 1);
});

test('failed continuation invalidates its association before a later retry', async () => {
  let count = 0;
  const h = harness(async function* () { if (++count === 2) throw Object.assign(new Error('page changed'), { status: 409, code: 'conversation_changed' }); yield { type: 'text', delta: 'ok' }; yield { type: 'done', conversation: handle() }; });
  await h.submit(body([user('task')]));
  const next = body([user('task'), answer('ok'), user('next')]);
  assert.equal((await h.submit(next))[0].payload.status, 409); assert.equal(h.engine.conversationState().tracked, 0);
});

for (const patch of [{ conversation_id: '' }, { conversation_id: 5 }, { reset_conversation: 'true' }]) test('invalid conversation options fail before webpage generation: ' + JSON.stringify(patch), async () => {
  let called = false; const h = harness(async function* () { called = true; });
  const response = (await h.submit(body([user('task')], patch)))[0]; assert.equal(response.payload.status, 400); assert.equal(called, false);
});
