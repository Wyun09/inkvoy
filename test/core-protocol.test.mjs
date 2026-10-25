import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRequest, parseToolResponse } from '../js/core/protocol.js';

const MODEL = 'deepseek-web';
const USER = { role: 'user', content: '完整问题' };
const TOOLS = [{ type: 'function', function: {
  name: 'weather',
  parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'], additionalProperties: false },
} }];

function prepare(overrides = {}) {
  return prepareRequest({ model: MODEL, messages: [USER], ...overrides }, MODEL);
}

function conversation(request) {
  return JSON.parse(/<conversation_json>\n([\s\S]*?)\n<\/conversation_json>/.exec(request.prompt)[1]);
}

function assertBad(callback, code) {
  assert.throws(callback, (error) => {
    assert.equal(error.status, 400);
    assert.equal(error.code, code);
    return true;
  });
}

test('retains more than 512 messages and more than 500000 prompt characters without trimming', () => {
  const messages = Array.from({ length: 620 }, (_, index) => ({
    role: index % 2 ? 'assistant' : 'user',
    content: `message-${index}-开始-${'完整历史'.repeat(280)}-结束-${index}`,
  }));
  const result = prepare({ messages, max_tokens: 1 });
  assert.ok(result.prompt.length > 500000);
  assert.deepEqual(conversation(result), messages);
  assert.ok(result.prompt.includes('approximately 1 tokens'));
  assert.ok(result.prompt.includes(messages[0].content));
  assert.ok(result.prompt.includes(messages.at(-1).content));
});

test('image labels preserve every text part and the original image order across history', () => {
  const dataUrl = `data:image/png;base64,${'A'.repeat(600000)}`;
  const messages = [
    { role: 'system', content: '所有历史都要保留' },
    { role: 'user', content: [
      { type: 'text', text: '图一之前' },
      { type: 'image_url', image_url: { url: 'https://example.invalid/first.png', detail: 'high' } },
      { type: 'text', text: '图一之后，图二之前' },
      { type: 'image_url', image_url: { url: dataUrl } },
      { type: 'text', text: '图二之后' },
    ] },
    { role: 'assistant', content: '上轮回答' },
    { role: 'user', content: [
      { type: 'image_url', image_url: { url: 'https://example.invalid/third.png' } },
      { type: 'text', text: '请比较三张图' },
    ] },
  ];
  const result = prepare({ messages });
  assert.deepEqual(result.images, [
    { url: 'https://example.invalid/first.png', messageIndex: 1, partIndex: 1, label: 'image_1' },
    { url: dataUrl, messageIndex: 1, partIndex: 3, label: 'image_2' },
    { url: 'https://example.invalid/third.png', messageIndex: 3, partIndex: 0, label: 'image_3' },
  ]);
  const history = conversation(result);
  assert.deepEqual(history[1].content.map((part) => part.text), [
    '图一之前', '[Attached image: image_1]', '图一之后，图二之前', '[Attached image: image_2]', '图二之后',
  ]);
  assert.deepEqual(history[3].content.map((part) => part.text), ['[Attached image: image_3]', '请比较三张图']);
  assert.equal(history[0].content, messages[0].content);
  assert.equal(history[2].content, messages[2].content);
  assert.ok(!result.prompt.includes(dataUrl));
  assert.ok(!result.prompt.includes('https://example.invalid/first.png'));
  assert.ok(result.prompt.length < 5000, 'Binary image payloads must not become prompt text');
  assert.deepEqual(prepare({ messages }).images, result.images, 'Labels remain stable for identical history');
  assert.deepEqual(messages[1].content[1], { type: 'image_url', image_url: { url: 'https://example.invalid/first.png', detail: 'high' } }, 'Input objects are not mutated');
});

test('supports all eight image attachments and rejects a ninth without silently dropping history', () => {
  const messages = Array.from({ length: 8 }, (_, index) => ({
    role: 'user', content: [{ type: 'image_url', image_url: { url: `https://example.invalid/${index}.png` } }],
  }));
  const result = prepare({ messages });
  assert.equal(result.images.length, 8);
  assert.equal(result.images.at(-1).label, 'image_8');
  assert.equal(conversation(result).length, 8);
  assertBad(() => prepare({ messages: [...messages, messages[0]] }), 'too_many_images');
});

test('invalid image URLs and unsupported content parts have explicit 400 codes', () => {
  for (const image_url of [undefined, null, 'https://example.invalid/image.png', {}, { url: '' }, { url: '  ' }, { url: null }, { url: 123 }]) {
    assertBad(() => prepare({ messages: [{ role: 'user', content: [{ type: 'image_url', image_url }] }] }), 'invalid_image_url');
  }
  for (const part of [null, 'hello', 42, { type: 'text', text: 123 }]) {
    assertBad(() => prepare({ messages: [{ role: 'user', content: [part] }] }), 'invalid_content_part');
  }
  assertBad(() => prepare({ messages: [{ role: 'user', content: [{ type: 'audio', audio: 'ignored' }] }] }), 'unsupported_content_type');
});

test('plain text, text parts and assistant null content keep their original content', () => {
  const messages = [
    { role: 'system', content: '  保留空白\n和换行  ' },
    { role: 'assistant', content: null },
    { role: 'user', content: [{ type: 'text', text: '第一部分\n' }, { type: 'text', text: '第二部分' }] },
  ];
  const result = prepare({ messages });
  assert.deepEqual(conversation(result), messages);
  assert.deepEqual(result.images, []);
  assertBad(() => prepare({ messages: [{ role: 'user', content: null }] }), 'invalid_content');
});

test('reasoning defaults off and maps the supported effort values', () => {
  assert.equal(prepare().reasoning, false);
  for (const reasoning_effort of ['off', 'none']) assert.equal(prepare({ reasoning_effort }).reasoning, false);
  for (const reasoning_effort of ['minimal', 'low', 'medium', 'high', 'xhigh', 'max']) {
    assert.equal(prepare({ reasoning_effort }).reasoning, true);
  }
});

test('explicit thinking type wins over conflicting reasoning effort', () => {
  assert.equal(prepare({ thinking: { type: 'enabled' } }).reasoning, true);
  assert.equal(prepare({ thinking: { type: 'disabled' } }).reasoning, false);
  assert.equal(prepare({ reasoning_effort: 'max', thinking: { type: 'disabled' } }).reasoning, false);
  assert.equal(prepare({ reasoning_effort: 'none', thinking: { type: 'enabled' } }).reasoning, true);
});

test('invalid reasoning and thinking values fail explicitly', () => {
  for (const reasoning_effort of [null, true, 1, '', 'automatic', 'HIGH', {}]) {
    assertBad(() => prepare({ reasoning_effort }), 'invalid_reasoning_effort');
  }
  for (const thinking of [null, true, 'enabled', {}, { type: 'auto' }, { type: true }]) {
    assertBad(() => prepare({ thinking }), 'invalid_thinking');
  }
  assertBad(() => prepare({ reasoning_effort: 'invalid', thinking: { type: 'enabled' } }), 'invalid_reasoning_effort');
});

test('usage inclusion requires the explicit stream option boolean and ignores unrelated tuning fields', () => {
  assert.equal(prepare().includeUsage, false);
  assert.equal(prepare({ stream: true, stream_options: { include_usage: true } }).includeUsage, true);
  for (const include_usage of [false, 'true', 1, null]) {
    assert.equal(prepare({ stream_options: { include_usage } }).includeUsage, false);
  }
  assert.equal(prepare({ stream_options: null }).includeUsage, false);
  const result = prepare({ temperature: 0.42, unknown_option: { arbitrary: true }, max_completion_tokens: 1000000 });
  assert.ok(result.prompt.includes('approximately 1000000 tokens'));
  assertBad(() => prepare({ max_tokens: 1000001 }), 'invalid_request_error');
});

test('tool schema validation and forced tool choice still apply with images and reasoning', () => {
  const request = prepare({
    tools: TOOLS, tool_choice: { type: 'function', function: { name: 'weather' } },
    reasoning_effort: 'high', messages: [{ role: 'user', content: [
      { type: 'text', text: '看图查天气' },
      { type: 'image_url', image_url: { url: 'https://example.invalid/weather.png' } },
    ] }],
  });
  assert.equal(request.toolsEnabled, true);
  assert.equal(request.forcedName, 'weather');
  assert.equal(request.reasoning, true);
  const parsed = parseToolResponse('{"tool_calls":[{"name":"weather","arguments":{"city":"上海"}}]}', request);
  assert.equal(parsed.finishReason, 'tool_calls');
  assert.deepEqual(JSON.parse(parsed.message.tool_calls[0].function.arguments), { city: '上海' });
  assert.throws(() => parseToolResponse('{"tool_calls":[{"name":"weather","arguments":{"city":123}}]}', request), (error) => error.status === 502);
  assert.throws(() => parseToolResponse('{"content":"不调用"}', request), (error) => error.status === 502);
  assertBad(() => prepare({ tools: [{ type: 'function', function: {} }] }), 'invalid_request_error');
  assert.equal(prepare({ tools: TOOLS, tool_choice: 'none' }).toolsEnabled, false);
});
