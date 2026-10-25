import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { locatorAction, MobilePage } from '../js/mobile-browser.js';
test('mobile locator facade preserves input, exact target selection, mode switches and actual image bytes', async t => {
  const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('https://chat.deepseek.com/**', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<textarea placeholder="Message DeepSeek"></textarea><textarea hidden>Artifact</textarea><button aria-label="internal-toggle" aria-pressed="false" onclick="this.setAttribute(\'aria-pressed\',\'true\')">深度思考</button><input type="file" multiple><button aria-label="New chat">+</button>' }));
  await page.goto('https://chat.deepseek.com/');
  const facade = new MobilePage(async (operation, argument) => {
    assert.equal(operation, 'evaluate');
    return page.evaluate(async ({ source, argument }) => await (0, eval)(`(${source})`)(argument), argument);
  });
  const input = facade.locator('textarea:visible');
  assert.equal(await input.count(), 1);
  const prompt = '中文 "quotes" C:\\file\n`source` 🧪';
  await input.fill(prompt); assert.equal(await input.inputValue(), prompt);
  const toggle = facade.locator('[aria-pressed]').filter({ hasText: /^深度思考$/ });
  assert.equal(await toggle.count(), 1); await toggle.click(); assert.equal(await toggle.evaluate(element => element.getAttribute('aria-pressed')), 'true');
  assert.equal(await facade.getByRole('button', { name: /^New chat$/ }).count(), 1);
  assert.equal(await facade.locator('input[type="file"]').evaluate(element => element.multiple), true);
  const bytes = new Uint8Array([1, 2, 3]);
  await page.evaluate(locatorAction, { spec: { selector: 'input[type="file"]' }, action: 'files', argument: [{ name: 'test.png', mimeType: 'image/png', base64: 'AQID' }] });
  assert.deepEqual(await page.locator('input').evaluate(async element => [...new Uint8Array(await element.files[0].arrayBuffer())]), [...bytes]);
  assert.doesNotMatch(facade.locator('input').evaluate.toString(), /\beval\(/, 'the production facade does not use eval in the remote page');
});
