import test from 'node:test';
import assert from 'node:assert/strict';
import { fromAnthropic } from '../js/anthropic.js';
import { createEngine } from '../js/engine.js';
const base = { model: 'deepseek-web', max_tokens: 128, messages: [{ role: 'user', content: 'hi' }] };
const tool = { name: 'Read', description: 'Read a file', input_schema: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'], additionalProperties: false } };
async function run(body, generate, path = '/v1/messages') {
  const frames = []; let resolve;
  const done = new Promise(r => { resolve = r; });
  const engine = createEngine({ generate }, (_id, kind, payload) => { frames.push({ kind, payload }); if (kind === 'end' || kind === 'response') resolve(); });
  engine.receive({ id: 'anthropic-fixture', path, body }); await done; return frames;
}
const events = frames => frames.filter(frame => frame.kind === 'data').flatMap(frame => frame.payload.text.split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6))));
test('Anthropic system blocks, text and cache markers normalize without inventing cache statistics', () => {
  const { body } = fromAnthropic({ ...base, system: [{ type: 'text', text: 'instruction', cache_control: { type: 'ephemeral' } }] });
  assert.deepEqual(body.messages[0], { role: 'system', content: 'instruction' });
  assert.equal(body.messages[1].content, 'hi');
});
test('tool_use and tool_result IDs survive the complete history translation', () => {
  const { body } = fromAnthropic({ ...base, tools: [tool], messages: [base.messages[0],
    { role: 'assistant', content: [{ type: 'thinking', thinking: 'old thought', signature: '' }, { type: 'text', text: 'Reading' }, { type: 'tool_use', id: 'toolu_one', name: 'Read', input: { file_path: 'a.txt' } }] },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_one', content: [{ type: 'text', text: 'real result' }] }, { type: 'text', text: 'Continue' }] }] });
  assert.equal(body.messages[1].tool_calls[0].id, 'toolu_one');
  assert.equal(body.messages[2].tool_call_id, 'toolu_one'); assert.equal(body.messages[2].role, 'tool');
  assert.equal(body.messages[3].role, 'user'); assert.ok(!JSON.stringify(body).includes('old thought'));
});
test('Anthropic images become data URLs without fetching remote URLs', () => {
  const { body } = fromAnthropic({ ...base, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AQID' } }] }] });
  assert.equal(body.messages[0].content[0].image_url.url, 'data:image/png;base64,AQID');
  assert.throws(() => fromAnthropic({ ...base, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'url', url: 'http://127.0.0.1/private' } }] }] }), /base64/);
});
test('long MCP names have stable bounded aliases and retain an inverse mapping', () => {
  const name = 'mcp__' + 'long_namespace_'.repeat(8);
  const first = fromAnthropic({ ...base, tools: [{ ...tool, name }] });
  const second = fromAnthropic({ ...base, tools: [{ ...tool, name }] });
  const shortened = first.body.tools[0].function.name;
  assert.ok(shortened.length <= 64); assert.equal(second.body.tools[0].function.name, shortened); assert.equal(first.names.get(shortened), name);
});
for (const [type, expected] of [['enabled', 'enabled'], ['adaptive', 'enabled'], ['disabled', 'disabled']]) test('Anthropic thinking maps to webpage mode: ' + type, () => {
  assert.equal(fromAnthropic({ ...base, thinking: { type } }).body.thinking.type, expected);
});
test('server web search uses the built-in webpage search without an external provider', () => {
  const converted = fromAnthropic({ ...base, tools: [{ type: 'web_search_20250305', name: 'web_search' }, tool] });
  assert.equal(converted.body.web_search, true); assert.equal(converted.body.tools.length, 1); assert.equal(converted.delegatedSearch, true);
});
test('server tool discovery is replaced by exposing all supplied deferred custom schemas', () => {
  const converted = fromAnthropic({ ...base, tools: [{ type: 'tool_search_tool_regex_20251119', name: 'tool_search' }, { ...tool, defer_loading: true }] });
  assert.equal(converted.body.tools.length, 1); assert.equal(converted.body.tools[0].function.name, 'Read');
});
for (const [name, patch] of [
  ['missing max_tokens', { max_tokens: undefined }], ['invalid stream', { stream: 'true' }],
  ['unsupported structured output', { output_config: { format: { type: 'json_schema' } } }],
  ['unsupported server execution tool', { tools: [{ name: 'run', type: 'code_execution_20250522' }] }],
  ['tool result without ID', { messages: [{ role: 'user', content: [{ type: 'tool_result', content: 'x' }] }] }],
]) test('Anthropic invalid input returns a typed error: ' + name, async () => {
  let called = false;
  const frames = await run({ ...base, ...patch }, async function* () { called = true; });
  assert.equal(frames[0].payload.status, 400); assert.equal(frames[0].payload.body.type, 'error'); assert.equal(called, false);
});
test('nonstream Anthropic response contains content blocks and honest estimated usage', async () => {
  const frames = await run({ ...base, thinking: { type: 'adaptive' } }, async function* () { yield { type: 'reasoning', delta: 'observed thought' }; yield { type: 'text', delta: 'hello' }; });
  const body = frames[0].payload.body;
  assert.equal(body.type, 'message'); assert.match(body.id, /^msg_/); assert.equal(body.stop_reason, 'end_turn');
  assert.equal(body.content[0].type, 'thinking'); assert.equal(body.content[0].signature, ''); assert.equal(body.content[1].text, 'hello');
  assert.equal(body.usage_meta.estimated, true); assert.equal(body.usage_meta.cache.status, 'unknown'); assert.equal(body.usage.cache_read_input_tokens, undefined);
});
test('streamed text/thinking events have ordered block lifecycle and a final message_stop', async () => {
  const frames = await run({ ...base, stream: true, thinking: { type: 'enabled' } }, async function* () {
    yield { type: 'reasoning', delta: 'think' }; yield { type: 'text', delta: 'hel' }; yield { type: 'text', delta: 'lo' };
  });
  const all = events(frames);
  assert.equal(all[0].type, 'message_start'); assert.equal(all.at(-1).type, 'message_stop');
  assert.equal(all.filter(e => e.type === 'content_block_start').length, all.filter(e => e.type === 'content_block_stop').length);
  assert.equal(all.filter(e => e.delta?.type === 'text_delta').map(e => e.delta.text).join(''), 'hello');
  assert.equal(all.filter(e => e.delta?.type === 'thinking_delta').map(e => e.delta.thinking).join(''), 'think');
  assert.equal(all.find(e => e.type === 'message_delta').delta.stop_reason, 'end_turn');
  assert.equal(all.find(e => e.type === 'message_delta').usage_meta.conversation.reused, false);
  assert.equal(all.find(e => e.type === 'message_delta').usage_meta.prompt_basis, 'logical_api_history');
});
test('omitted thinking is not exposed in Anthropic output', async () => {
  const all = events(await run({ ...base, stream: true, thinking: { type: 'enabled', display: 'omitted' } }, async function* () { yield { type: 'reasoning', delta: 'not displayed' }; yield { type: 'text', delta: 'answer' }; }));
  assert.ok(!JSON.stringify(all).includes('not displayed'));
});
test('tool calls stream as input_json_delta and finish with tool_use', async () => {
  const all = events(await run({ ...base, stream: true, tools: [tool] }, async function* () { yield { type: 'text', delta: JSON.stringify({ tool_calls: [{ name: 'Read', arguments: { file_path: 'fixture.txt' } }] }) }; }));
  const block = all.find(e => e.content_block?.type === 'tool_use').content_block;
  assert.equal(block.name, 'Read'); assert.match(block.id, /^call_/);
  assert.deepEqual(JSON.parse(all.find(e => e.delta?.type === 'input_json_delta').delta.partial_json), { file_path: 'fixture.txt' });
  assert.equal(all.find(e => e.type === 'message_delta').delta.stop_reason, 'tool_use');
});
test('a two-request Anthropic tool loop consumes the actual tool_result and continues', async () => {
  const first = (await run({ ...base, tools: [tool] }, async function* () { yield { type: 'text', delta: JSON.stringify({ tool_calls: [{ name: 'Read', arguments: { file_path: 'fixture.txt' } }] }) }; }))[0].payload.body;
  assert.equal(first.stop_reason, 'tool_use');
  let sawResult = false;
  const second = (await run({ ...base, tools: [tool], messages: [base.messages[0], { role: 'assistant', content: first.content }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: first.content[0].id, content: 'REAL_FILE_RESULT' }] }] }, async function* ({ prompt }) {
    sawResult = prompt.includes('REAL_FILE_RESULT') && /"role"\s*:\s*"tool"/.test(prompt);
    yield { type: 'text', delta: JSON.stringify({ status: 'complete', content: 'Finished from the file result.' }) };
  }))[0].payload.body;
  assert.equal(sawResult, true); assert.equal(second.stop_reason, 'end_turn'); assert.equal(second.content[0].text, 'Finished from the file result.');
});
test('count_tokens is estimated and never opens or generates a webpage response', async () => {
  let called = false;
  const frames = await run({ model: 'deepseek-web', messages: base.messages, tools: [tool] }, async function* () { called = true; }, '/v1/messages/count_tokens');
  assert.ok(frames[0].payload.body.input_tokens > 0); assert.equal(frames[0].payload.body.usage_meta.estimated, true); assert.equal(called, false);
});
test('errors after streaming begins become an error event and do not claim normal completion', async () => {
  const frames = await run({ ...base, stream: true }, async function* () { yield { type: 'text', delta: 'partial' }; throw Object.assign(new Error('site failed'), { status: 502, code: 'UPSTREAM_ERROR' }); });
  const all = events(frames); assert.ok(all.some(e => e.type === 'error')); assert.ok(!all.some(e => e.type === 'message_stop'));
});
