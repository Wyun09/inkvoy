import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { reasoningControl } from '../js/core/reasoning-control.js';
import { MobileBrowser } from '../js/mobile-browser.js';
import { createEngine } from '../js/engine.js';
let browser;
before(async () => { browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); });
after(async () => { await browser?.close(); });
async function fixture(t, control) {
  const page = await browser.newPage(); t.after(() => page.close());
  await page.route('https://chat.deepseek.com/**', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><script>window.searchClicks=0</script><form><textarea placeholder="Message DeepSeek"></textarea><button type="button" aria-pressed="false">深度思考</button>' + control + '</form>' }));
  await page.goto('https://chat.deepseek.com/'); return page;
}
for (const [name, html, expected] of [
  ['Chinese smart search', '<div tabindex="0" aria-pressed="true" class="ds-toggle-button ds-toggle-button--selected">智能搜索</div>', true],
  ['English search switch', '<button type="button" role="switch" aria-checked="false">Web Search</button>', false],
  ['class-only mobile search', '<div class="ds-toggle-button ds-toggle-button--selected"><span>联网搜索</span></div>', true],
  ['disabled marker is not an off state', '<button type="button" data-state="disabled">智能搜索</button>', null],
]) test('web search detection: ' + name, async t => {
  const page = await fixture(t, html); const state = await page.evaluate(reasoningControl, { feature: 'search' });
  assert.equal(state.count, 1); assert.equal(state.enabled, expected);
});
test('web search toggles both ways without toggling the separate thinking control', async t => {
  const page = await fixture(t, '<button type="button" aria-pressed="false" id="search" onclick="searchClicks++;this.setAttribute(\'aria-pressed\',this.getAttribute(\'aria-pressed\')!==\'true\')">智能搜索</button>');
  const adapter = new MobileBrowser(() => {}, { pollMs: 20 });
  await adapter._beforeSubmit(page, { webSearch: true, reasoning: false, deadline: Date.now() + 3000 });
  await adapter._beforeSubmit(page, { webSearch: true, reasoning: false, deadline: Date.now() + 3000 });
  assert.equal(await page.evaluate(() => searchClicks), 1);
  assert.equal((await page.evaluate(reasoningControl, {})).enabled, false);
  await adapter._beforeSubmit(page, { webSearch: false, reasoning: false, deadline: Date.now() + 3000 });
  assert.equal(await page.evaluate(() => searchClicks), 2);
  assert.equal((await page.evaluate(reasoningControl, { feature: 'search' })).enabled, false);
});
test('search controls without trustworthy state fail before sending', async t => {
  const page = await fixture(t, '<button type="button" onclick="searchClicks++">智能搜索</button>');
  const adapter = new MobileBrowser(() => {}, { pollMs: 20 });
  await assert.rejects(adapter._beforeSubmit(page, { webSearch: true, reasoning: false, deadline: Date.now() + 3000 }), error => error.code === 'web_search_state_unknown');
  assert.equal(await page.evaluate(() => searchClicks), 0);
});
test('a search mode that changes requested thinking state is not silently accepted', async t => {
  const page = await fixture(t, '<button type="button" aria-pressed="false" onclick="this.setAttribute(\'aria-pressed\',\'true\');document.querySelector(\'button\').setAttribute(\'aria-pressed\',\'true\')">智能搜索</button>');
  const adapter = new MobileBrowser(() => {}, { pollMs: 20 });
  await assert.rejects(adapter._beforeSubmit(page, { webSearch: true, reasoning: false, deadline: Date.now() + 3000 }), error => error.code === 'reasoning_search_conflict');
});
for (const [name, defaultValue, bodyValue, expected] of [
  ['app default enabled', true, undefined, true],
  ['app default disabled', false, undefined, false],
  ['explicit false overrides enabled default', true, false, false],
  ['explicit true overrides disabled default', false, true, true],
]) test('web search request policy: ' + name, async () => {
  let resolve, observed; const done = new Promise(r => { resolve = r; });
  const backend = { async *generate(options) { observed = options.webSearch; yield { type: 'text', delta: 'ok' }; } };
  const engine = createEngine(backend, (_id, kind, payload) => { if (kind === 'response') resolve(payload); }, { defaultWebSearch: () => defaultValue });
  engine.receive({ id: name, path: '/v1/chat/completions', body: { model: 'deepseek-web', messages: [{ role: 'user', content: 'hi' }], ...(bodyValue === undefined ? {} : { web_search: bodyValue }) } });
  assert.equal((await done).status, 200); assert.equal(observed, expected);
});
test('invalid web_search input is rejected without invoking the webpage backend', async () => {
  let resolve, called = false; const done = new Promise(r => { resolve = r; });
  const engine = createEngine({ async *generate() { called = true; } }, (_id, kind, payload) => { if (kind === 'response') resolve(payload); });
  engine.receive({ path: '/v1/chat/completions', body: { model: 'deepseek-web', messages: [{ role: 'user', content: 'hi' }], web_search: 'true' } });
  const response = await done; assert.equal(response.status, 400); assert.equal(response.body.error.code, 'invalid_web_search'); assert.equal(called, false);
});
