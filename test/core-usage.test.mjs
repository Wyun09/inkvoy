import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateUsage } from '../js/core/usage.js';

test('empty usage is zero and totals are integers with reasoning details', () => {
  assert.deepEqual(estimateUsage(), {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    completion_tokens_details: { reasoning_tokens: 0 },
  });
});

test('Chinese and other Unicode characters use the documented weights with ceiling', () => {
  // 3 Han / 1.5 + 4 ASCII / 4 = 3 tokens.
  assert.equal(estimateUsage({ prompt: '中文汉abcd' }).prompt_tokens, 3);
  assert.equal(estimateUsage({ prompt: '中a' }).prompt_tokens, 1);
  assert.equal(estimateUsage({ prompt: '中文a' }).prompt_tokens, 2);
  // Count Unicode code points rather than UTF-16 code units.
  assert.equal(estimateUsage({ prompt: '𠀀𠀁𠀂' }).prompt_tokens, 2);
  assert.equal(estimateUsage({ prompt: '😀😀😀😀' }).prompt_tokens, 1);
  assert.equal(estimateUsage({ prompt: 'éééé' }).prompt_tokens, 1);
});

test('completion includes visible content and reasoning while details identify reasoning tokens', () => {
  const result = estimateUsage({ prompt: 'abcdefgh', content: 'abcd', reasoning: '中文汉' });
  assert.deepEqual(result, {
    prompt_tokens: 2,
    completion_tokens: 3,
    total_tokens: 5,
    completion_tokens_details: { reasoning_tokens: 2 },
  });
  assert.equal(estimateUsage({ content: 'a', reasoning: 'a' }).completion_tokens, 1, 'Round combined completion weight once');
});

test('the full prompt is counted and image attachments do not invent token usage', () => {
  const prompt = `${'中'.repeat(600000)}${'a'.repeat(400000)}`;
  const plain = estimateUsage({ prompt, content: '结果' });
  assert.equal(plain.prompt_tokens, 500000);
  const withImages = estimateUsage({ prompt, content: '结果', images: [
    { url: `data:image/png;base64,${'A'.repeat(1000000)}`, label: 'image_1' },
    { url: 'https://example.invalid/image.png', label: 'image_2' },
  ] });
  assert.deepEqual(withImages, plain);
});

test('all estimates are nonnegative, monotone, and total is strictly prompt plus completion', () => {
  let previous = estimateUsage();
  let prompt = '';
  let content = '';
  let reasoning = '';
  for (const character of '中a文😀𠀀éabcdefghijklmnopqrstuvwxyz汉字') {
    prompt += character;
    content += character;
    reasoning += character;
    const current = estimateUsage({ prompt, content, reasoning });
    assert.ok(current.prompt_tokens >= previous.prompt_tokens);
    assert.ok(current.completion_tokens >= previous.completion_tokens);
    assert.ok(current.completion_tokens_details.reasoning_tokens >= previous.completion_tokens_details.reasoning_tokens);
    assert.ok(current.completion_tokens_details.reasoning_tokens <= current.completion_tokens);
    for (const count of [current.prompt_tokens, current.completion_tokens, current.total_tokens, current.completion_tokens_details.reasoning_tokens]) {
      assert.ok(Number.isSafeInteger(count) && count >= 0);
    }
    assert.equal(current.total_tokens, current.prompt_tokens + current.completion_tokens);
    previous = current;
  }
});

test('missing or non-text optional output fields cannot produce NaN or negative usage', () => {
  const result = estimateUsage({ prompt: null, content: undefined, reasoning: false, images: null });
  assert.equal(result.total_tokens, 0);
  assert.equal(result.completion_tokens_details.reasoning_tokens, 0);
});
