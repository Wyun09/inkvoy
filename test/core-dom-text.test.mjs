import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { extractDomTexts, BoundedTextTail } from '../js/core/dom-text.js';

test('protected pre text is forwarded immediately, and committed edits still fail', () => {
  const tail = new BoundedTextTail();
  assert.equal(tail.push('{', { now: 0, protectedCode: true }), '{');
  assert.equal(tail.push('{"content":', { now: 1, protectedCode: true }), '"content":');
  assert.throws(() => tail.push('{"changed":', { now: 2, protectedCode: true }), error => error.code === 'ANSWER_REVISED');
});

test('semantic fallback retracts only its bounded tail and flushes without waiting for completion', () => {
  const tail = new BoundedTextTail({ maxChars: 4, maxHoldMs: 75 });
  assert.equal(tail.push('hello', { now: 0 }), 'h');
  assert.equal(tail.push('help!', { now: 20 }), '');
  assert.equal(tail.push('help!', { now: 75 }), 'elp!');
  assert.throws(() => tail.push('Help!', { now: 76 }), error => error.code === 'ANSWER_REVISED');
  const long = new BoundedTextTail();
  const answer = 'x'.repeat(5000);
  assert.equal(long.push(answer, { now: 0 }).length, 4968);
  assert.equal(answer.length - long.committed.length, 32);
  assert.equal(long.push(answer, { now: 75 }).length, 32);
});

test('fallback holds complete UTF-16 pairs at its emission boundary', () => {
  const tail = new BoundedTextTail({ maxChars: 2, maxHoldMs: 75 });
  assert.equal(tail.push('a🧪bc', { now: 0 }), 'a🧪');
  assert.equal(tail.push('a🧪bc', { now: 75 }), 'bc');
});

test('protected transport withholds only unfinished closing delimiters and preserves inner fences', () => {
  const tail = new BoundedTextTail();
  assert.equal(tail.push('OK', { protectedCode: true }), 'OK');
  for (const suffix of ['\n', '\n`', '\n``', '\n```', '\n`````']) {
    assert.equal(tail.push('OK' + suffix, { protectedCode: true }), '');
  }
  assert.equal(tail.push('OK', { protectedCode: true, final: true }), '');
  const nested = new BoundedTextTail();
  const chunks = [];
  for (const text of ['``', '```ts\n', '```ts\nconst x = 1;\n', '```ts\nconst x = 1;\n```', '```ts\nconst x = 1;\n```\nDone.']) {
    chunks.push(nested.push(text, { protectedCode: true }));
  }
  chunks.push(nested.push('```ts\nconst x = 1;\n```\nDone.\n', { protectedCode: true, final: true }));
  assert.equal(chunks.join(''), '```ts\nconst x = 1;\n```\nDone.\n');
});

test('captured DeepSeek DOM preserves fenced JSON and ignores language/copy/download UI', async t => {
  const { chromium } = await import('playwright');
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  } catch {
    t.skip('Install a Playwright Chromium browser or Microsoft Edge to run the offline captured-DOM fixture.');
    return;
  }
  t.after(() => browser.close());
  const context = await browser.newContext({ offline: true });
  const page = await context.newPage();
  const html = await fs.readFile(new URL('./fixtures/deepseek-fenced-reply.html', import.meta.url), 'utf8');
  const read = async () => (await page.evaluate(extractDomTexts, {
    selectors: [{ key: 'answer', selector: '.ds-assistant-message-main-content' }],
  })).answer;

  await page.setContent(html);
  const expected = await page.locator('pre').textContent();
  const first = await read();
  assert.equal(first.source, 'single_code_block');
  assert.equal(first.uncertain, false);
  assert.equal(first.text, expected);
  assert.doesNotMatch(first.text, /复制|下载/);
  const envelope = JSON.parse(first.text);
  const nested = JSON.parse(envelope.tool_calls[0].arguments.content);
  assert.ok(nested.path.includes('\\'));
  assert.ok(nested.code.includes('`value`'));
  assert.ok(first.text.includes('\\"'), 'JSON quote escapes survive DOM extraction');

  await page.locator('pre').evaluate(pre => {
    const text = pre.textContent;
    pre.replaceChildren(...Array.from(text).map(character => {
      const span = document.createElement('span');
      span.className = 'token string';
      span.textContent = character;
      return span;
    }));
  });
  assert.equal((await read()).text, expected, 'highlight token boundaries do not change the transported text');
  await page.locator('pre').evaluate(pre => pre.replaceChildren());
  const repaint = await read();
  assert.equal(repaint.text, '');
  assert.equal(repaint.uncertain, true, 'a transient empty pre is not a new empty answer');
  await page.locator('pre').evaluate((pre, text) => { pre.textContent = text; }, expected);
  assert.equal((await read()).text, expected);

  await page.locator('pre').evaluate(pre => pre.remove());
  const bannerOnly = await read();
  assert.equal(bannerOnly.text, '');
  assert.equal(bannerOnly.uncertain, true, 'language and copy/download banners never become answer text');

  await page.setContent(html);
  await page.locator('.ds-assistant-message-main-content').evaluate(root => {
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Surrounding explanation must remain';
    root.prepend(paragraph);
  });
  const mixed = await read();
  assert.equal(mixed.source, 'semantic_dom');
  assert.ok(mixed.text.startsWith('Surrounding explanation must remain\n\n'));
  assert.ok(mixed.text.includes(expected));
  assert.doesNotMatch(mixed.text, /复制|下载/);

  await page.setContent(html);
  await page.locator('.ds-assistant-message-main-content').evaluate(root => {
    const second = root.querySelector('.md-code-block').cloneNode(true);
    second.querySelector('pre').textContent = 'SECOND_BLOCK_MUST_REMAIN';
    root.append(second);
  });
  const multiple = await read();
  assert.equal(multiple.source, 'semantic_dom');
  assert.ok(multiple.text.includes(expected));
  assert.ok(multiple.text.endsWith('SECOND_BLOCK_MUST_REMAIN'));
  await page.locator('.md-code-block').nth(1).locator('pre').evaluate(pre => pre.remove());
  assert.equal((await read()).source, 'semantic_dom', 'two block wrappers cannot silently become a whole-answer single block');

  await page.setContent('<div class="ds-assistant-message-main-content"><p>one</p><p>two<br>three</p><ul><li>four</li><li>five</li></ul></div>');
  assert.equal((await read()).text, 'one\n\ntwo\nthree\n\nfour\nfive');
  assert.equal((await read()).stableText, 'one\n\ntwo\nthree');
});
