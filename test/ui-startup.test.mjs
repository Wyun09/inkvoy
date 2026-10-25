import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { uiHarness, readyState, navigateLegacy } from './ui-harness.mjs';

for (const storage of ['disabled', 'blocked', 'read-only']) {
  test(`packaged app initializes and handles buttons when local storage is ${storage}`, async t => {
    const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
    t.after(() => browser.close());
    const { context, page } = await uiHarness(browser, { width: 390, height: 844 }, { storage });
    t.after(() => context.close());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluate(state => BridgeDashboard.render(state), readyState);
    await page.locator('#theme').click();
    assert.equal(await page.locator('body').getAttribute('class'), 'dark');
    await page.locator('#command-open').click();await page.locator('#command-input').fill('使用帮助');await page.keyboard.press('Enter');
    assert.equal(await page.locator('#sheet-scrim').isVisible(), true);
    await page.locator('#close-sheet').click();
    await navigateLegacy(page,'web');
    assert.equal(await page.locator('#page-web').isVisible(), true);
    await navigateLegacy(page, 'connect');
    await page.getByRole('button', { name: '复制本机 API 密钥', exact: true }).click();
    assert.ok((await page.evaluate(() => nativeActions)).some(item => item.action === 'copy' && item.payload.field === 'key'));
    await navigateLegacy(page,'home');
    await page.locator('#service-toggle').click();
    assert.ok((await page.evaluate(() => nativeActions)).some(item => item.action === 'stop'));
    assert.deepEqual(errors, []);
  });
}

test('a fatal UI startup error is reported to the native fallback without claiming readiness', async t => {
  const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  t.after(() => browser.close());
  const { context, page } = await uiHarness(browser, undefined, { failStartup: true });
  t.after(() => context.close());
  assert.deepEqual(await page.evaluate(() => nativeStartupErrors), ['ResizeObserver unavailable']);
  assert.equal(await page.evaluate(() => Boolean(window.nativeReady)), false);
});
