import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { createEngine, resolveDataImages } from '../js/engine.js';
import { MobileBuffer } from '../js/platform.js';

const tools = [{ type: 'function', function: { name: 'read_file', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false } } }];
function harness(generate, options) {
  const events = []; const pending = new Map();
  const backend = { generate, async status() { return { loggedIn: true }; }, async openLogin() { return { loggedIn: true }; } };
  const engine = createEngine(backend, (id, kind, payload) => {
    events.push({ id, kind, payload });
    if (kind === 'response' || kind === 'end') pending.get(id)?.resolve(events.filter(item => item.id === id));
  }, options);
  let sequence = 0;
  const submit = body => {
    const id = 'test-' + ++sequence;
    let resolve; const promise = new Promise(r => { resolve = r; }); pending.set(id, { resolve });
    engine.receive({ id, path: '/v1/chat/completions', body: { model: 'deepseek-web', messages: [{ role: 'user', content: 'Proceed' }], ...body } });
    return { id, promise };
  };
  const chunks = frames => frames.flatMap(event => event.kind === 'data' ? event.payload.text.split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6))) : []);
  return { engine, events, submit, chunks };
}
test('mobile nonstream response preserves reasoning, usage and unknown cache provenance', async () => {
  const h = harness(async function* () { yield { type: 'reasoning', delta: 'Actual thought' }; yield { type: 'text', delta: 'Actual answer' }; });
  const frames = await h.submit({ reasoning_effort: 'high' }).promise;
  const response = frames.find(item => item.kind === 'response').payload;
  assert.equal(response.status, 200); assert.equal(response.body.choices[0].message.reasoning_content, 'Actual thought');
  assert.equal(response.body.usage_meta.cache.status, 'unknown'); assert.ok(response.body.usage.prompt_tokens > 0);
});
test('mobile SSE publishes real content and only validated function calls', async () => {
  const h = harness(async function* () { yield { type: 'text', delta: '{"content":"Reading","tool_calls":[' }; await delay(5); yield { type: 'text', delta: '{"name":"read_file","arguments":{"path":"src/main.ts"}}]}' }; });
  const frames = await h.submit({ tools, stream: true, stream_options: { include_usage: true } }).promise;
  const chunks = h.chunks(frames); const choices = chunks.flatMap(chunk => chunk.choices || []);
  assert.equal(choices.map(choice => choice.delta.content || '').join(''), 'Reading');
  assert.equal(choices.flatMap(choice => choice.delta.tool_calls || []).length, 1); assert.equal(choices.at(-1).finish_reason, 'tool_calls');
  assert.ok(frames.some(frame => frame.payload.text === 'data: [DONE]\n\n'));
});
test('mobile invalid envelopes regenerate once without repeating published progress', async () => {
  let attempts = 0;
  const h = harness(async function* ({ prompt }) {
    if (++attempts === 1) yield { type: 'text', delta: '{"content":"Checking","bad":?' };
    else { assert.match(prompt, /gateway_format_retry/); yield { type: 'text', delta: '{"content":"Checking","tool_calls":[{"name":"read_file","arguments":{"path":"A"}}]}' }; }
  });
  const chunks = h.chunks(await h.submit({ tools, stream: true, stream_options: { include_usage: true } }).promise);
  assert.equal(attempts, 2); assert.equal(chunks.flatMap(chunk => chunk.choices || []).map(choice => choice.delta.content || '').join(''), 'Checking');
  assert.equal(chunks.at(-1).usage_meta.format_retries, 1);
});
test('mobile no-output recovery preserves reasoning mode and cannot retry a third time', async () => {
  let attempts = 0;
  const h = harness(async function* ({ reasoning }) {
    assert.equal(reasoning, true); attempts++;
    throw Object.assign(new Error('No output'), { code: 'UPSTREAM_NO_OUTPUT', status: 504 });
  });
  const frames = await h.submit({ reasoning_effort: 'high' }).promise;
  assert.equal(attempts, 2); assert.equal(frames.at(-1).payload.body.error.code, 'UPSTREAM_NO_OUTPUT');
});
test('mobile login errors do not regenerate and never claim successful completion', async () => {
  let attempts = 0;
  const h = harness(async function* () { attempts++; throw Object.assign(new Error('Login required'), { code: 'LOGIN_REQUIRED', status: 401 }); });
  const frames = await h.submit({ tools, stream: true }).promise;
  assert.equal(attempts, 1); assert.equal(frames.at(-1).payload.status, 401);
});
test('mobile cancellation waits for generator cleanup before starting the next request', async () => {
  let calls = 0, cleaned = false;
  const h = harness(async function* ({ signal }) {
    const current = ++calls;
    if (current === 1) {
      try { yield { type: 'text', delta: 'Partial' }; await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })); }
      finally { await delay(25); cleaned = true; }
    } else { assert.equal(cleaned, true); yield { type: 'text', delta: 'Next' }; }
  });
  const first = h.submit({ stream: true }); await delay(10); const second = h.submit({});
  h.engine.cancel(first.id); const frames = await second.promise;
  assert.equal(calls, 2); assert.equal(frames.at(-1).payload.body.choices[0].message.content, 'Next');
});
test('mobile queue limits and queue wait consume the same request deadline', async () => {
  const h = harness(async function* ({ signal }) { await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })); }, { timeoutMs: 60, maxQueue: 1 });
  const first = h.submit({}); const second = h.submit({}); const third = h.submit({});
  assert.equal((await third.promise).at(-1).payload.status, 429);
  assert.equal((await first.promise).at(-1).payload.status, 504); assert.equal((await second.promise).at(-1).payload.status, 504);
});
test('mobile image data is real bytes and remote URLs are rejected without network requests', () => {
  const [image] = resolveDataImages([{ url: 'data:image/png;base64,AQID', label: 'image_1' }]);
  assert.ok(MobileBuffer.isBuffer(image.buffer)); assert.deepEqual([...image.buffer], [1, 2, 3]); assert.equal(image.buffer.toString('base64'), 'AQID');
  assert.throws(() => resolveDataImages([{ url: 'http://127.0.0.1/private', label: 'image_1' }]), error => error.code === 'unsupported_image_url');
  assert.throws(() => resolveDataImages([{ url: 'data:image/png;base64,A===', label: 'image_1' }]), error => error.status === 400);
});
