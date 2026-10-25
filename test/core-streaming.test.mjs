import test from 'node:test';
import assert from 'node:assert/strict';
import { ContentEnvelopeDecoder } from '../js/core/streaming.js';

function decodeChunks(chunks) {
  const decoder = new ContentEnvelopeDecoder();
  const deltas = chunks.map((chunk) => decoder.push(chunk));
  assert.ok(deltas.every((delta) => delta.isWellFormed()), 'Each delta is safe for independent UTF-8 encoding');
  assert.equal(deltas.join(''), decoder.content);
  return decoder.content;
}

test('decodes split Unicode escapes, surrogate pairs and JSON escapes at every boundary', () => {
  const raw = '{"content":"\\u4e2d\\u6587\\n\\ud83d\\ude00\\\"\\\\\\/\\b\\f\\r\\t"}';
  const expected = JSON.parse(raw).content;
  for (let boundary = 0; boundary <= raw.length; boundary += 1) {
    assert.equal(decodeChunks([raw.slice(0, boundary), raw.slice(boundary)]), expected, `Split at ${boundary}`);
  }
  assert.equal(decodeChunks([...raw]), expected);
});

test('returns top-level content immediately before the JSON object is finished', () => {
  const decoder = new ContentEnvelopeDecoder();
  assert.equal(decoder.push('{"content":"第'), '第');
  assert.equal(decoder.push('一段'), '一段');
  assert.equal(decoder.push('，继续'), '，继续');
  assert.equal(decoder.push('"}'), '');
  assert.equal(decoder.content, '第一段，继续');
});

test('holds a split high surrogate until its matching low surrogate is available', () => {
  const decoder = new ContentEnvelopeDecoder();
  assert.equal(decoder.push('{"content":"before\\ud83d'), 'before');
  assert.equal(decoder.push('\\u'), '');
  assert.equal(decoder.push('de00 after"}'), '😀 after');
  assert.equal(decoder.content, 'before😀 after');
  for (const raw of ['{"content":"\\ud83d"}', '{"content":"\\ude00"}', '{"content":"\\ud83dX"}']) {
    assert.throws(() => new ContentEnvelopeDecoder().push(raw), (error) => error.status === 502 && error.code === 'invalid_tool_response');
  }
});

test('skips nested objects, arrays and strings containing content keys', () => {
  const raw = JSON.stringify({
    metadata: { content: 'private metadata', nested: [{ content: 'private array' }], quoted: '\\"}, content: secret' },
    tool_calls: [{ name: 'read_file', arguments: { content: 'private tool arguments', nested: [1, { content: 'secret' }] } }],
    another: null,
    content: 'public text',
  });
  assert.equal(decodeChunks([...raw]), 'public text');
  assert.equal(decodeChunks([raw]), 'public text');
});

test('tool-only and null content envelopes produce no visible content', () => {
  assert.equal(decodeChunks([...'{"tool_calls":[{"name":"tool","arguments":{"content":"secret"}}]}']), '');
  assert.equal(decodeChunks([...'{"content":null,"tool_calls":[]}']), '');
});

test('accepts split Markdown fences and escaped top-level content keys', () => {
  assert.equal(decodeChunks(['`', '``j', 'son\n{', '"con\\u0074ent":', '"正文"}', '\n```']), '正文');
});

test('invalid escapes, raw control characters and duplicate streamed content fail with 502', () => {
  for (const raw of ['{"content":"\\x"}', '{"content":"\\u12zz"}', '{"content":"raw\nnewline"}', '{"content":"first","content":"second"}', 'prose before {"content":"text"}']) {
    const decoder = new ContentEnvelopeDecoder();
    assert.throws(() => decoder.push(raw), (error) => error.status === 502 && error.code === 'invalid_tool_response');
  }
});
