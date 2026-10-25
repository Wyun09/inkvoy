import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { uiHarness, readyState } from '../test/ui-harness.mjs';
const output = new URL('../preview/', import.meta.url); await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
try {
  const { page, context } = await uiHarness(browser);
  await page.evaluate(state => { BridgeDashboard.render(state); BridgeDashboard.setTheme('light'); }, readyState);
  await page.screenshot({ path: new URL('home-light.png', output).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
  await page.locator('.bottom-nav [data-navigate="connect"]').click();
  await page.screenshot({ path: new URL('connect-light.png', output).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
  await page.locator('.bottom-nav [data-navigate="home"]').click();
  await page.evaluate(() => BridgeDashboard.setTheme('dark'));
  await page.screenshot({ path: new URL('home-dark.png', output).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
  await page.evaluate(() => { BridgeDashboard.render({ reasoningMode: { count: 1, enabled: false, source: 'ds_toggle_component' } }); BridgeDashboard.setTheme('light'); });
  await page.locator('.health-strip [data-action="reasoning"]').click();
  await page.screenshot({ path: new URL('reasoning-sheet.png', output).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
  await context.close();
  await writeFile(new URL('README.md', output), '# UI preview\n\nThese are the actual packaged HTML/CSS UI assets rendered in desktop Edge at 390x844 with a simulated native state. They are not Android-device screenshots or proof of a real logged-in session.\n');
  console.log('Captured four UI previews from packaged assets with simulated state.');
} finally { await browser.close(); }
