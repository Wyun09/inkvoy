import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { sendControl } from '../js/send-control.js';
import { MobileBrowser } from '../js/mobile-browser.js';
let browser;
before(async () => { browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); });
after(async () => { await browser?.close(); });
const arrow = '<svg><path d="M8.3125 0.980206C8.66767 1.05312 8.97902 1.2042 9.2627 1.43235L9 3.95579V15.0417H7V3.95579Z"/></svg>';
const actualSend = '<div role="button" data-send class="ds-button ds-button--primary ds-button--circle">' + arrow + '</div>';
async function fixture(t, control, { outside = '', sticky = false } = {}) {
  const page = await browser.newPage(); t.after(() => page.close());
  await page.route('https://chat.deepseek.com/**', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><meta charset="utf-8">${outside}<form><div><textarea placeholder="Message DeepSeek">hi</textarea></div>${control}</form><script>
    window.clicks=0;window.enters=0;
    document.querySelector('textarea').addEventListener('keydown',e=>{if(e.key==='Enter')window.enters++});
    document.querySelectorAll('[data-send]').forEach(node=>node.addEventListener('click',e=>{e.preventDefault();window.clicks++;${sticky ? '' : "document.querySelector('textarea').value='';"}}));
  </script>` }));
  await page.goto('https://chat.deepseek.com/'); return page;
}
for (const [name, control, source] of [
  ['Chinese text', '<button type="button" data-send>发送</button>', 'accessible_name'],
  ['English accessible name', '<button type="button" data-send aria-label="Send message"><svg/></button>', 'accessible_name'],
  ['title on nested icon', '<div role="button" data-send title="发送消息"><span>↑</span></div>', 'accessible_name'],
  ['aria-labelledby', '<span id="send-label">发送</span><button type="button" data-send aria-labelledby="send-label"></button>', 'accessible_name'],
  ['native submit', '<button type="submit" data-send><svg/></button>', 'form_submit'],
  ['test id', '<div role="button" data-send data-testid="send-button"><svg/></div>', 'test_id'],
  ['observed unlabeled DeepSeek arrow component', actualSend, 'deepseek_send_arrow'],
]) test('mobile sends by clicking: ' + name, async t => {
  const page = await fixture(t, control);
  const state = await page.evaluate(sendControl, { prompt: 'hi', nonce: 'fixture-send' });
  assert.equal(state.clicked, true); assert.equal(state.source, source);
  assert.equal(await page.evaluate(() => clicks), 1); assert.equal(await page.evaluate(() => enters), 0);
  assert.equal(await page.locator('textarea').inputValue(), '');
});
test('a repeated operation with the same nonce cannot send twice', async t => {
  const page = await fixture(t, actualSend);
  await page.evaluate(sendControl, { prompt: 'hi', nonce: 'same-request' });
  assert.equal((await page.evaluate(sendControl, { prompt: 'hi', nonce: 'same-request' })).reason, 'already_triggered');
  assert.equal(await page.evaluate(() => clicks), 1);
});
test('hidden copies and buttons outside the composer are ignored', async t => {
  const page = await fixture(t, '<button type="button" hidden data-send>发送</button>' + actualSend, { outside: '<aside><button data-send aria-label="Send message">Send message</button></aside>' });
  assert.equal((await page.evaluate(sendControl, { prompt: 'hi', nonce: 'one' })).clicked, true);
  assert.equal(await page.evaluate(() => clicks), 1);
});
for (const [name, control, expected] of [
  ['ambiguous send controls', '<button type="button" data-send>发送</button><button type="button" data-send>Send</button>', 'multiple_send_controls'],
  ['disabled native button', '<button type="button" data-send disabled>发送</button>', 'send_disabled'],
  ['disabled DeepSeek class', actualSend.replace('ds-button--circle', 'ds-button--circle ds-button--disabled'), 'send_disabled'],
  ['unknown icon-only control', '<div role="button" data-send class="ds-button ds-button--primary ds-button--circle"><svg><path d="M1 1L2 2"/></svg></div>', 'send_missing'],
  ['active stop control', actualSend + '<button type="button">停止生成</button>', 'generation_active'],
]) test('mobile does not submit: ' + name, async t => {
  const page = await fixture(t, control);
  const state = await page.evaluate(sendControl, { prompt: 'hi', nonce: 'blocked-request' });
  assert.equal(state.clicked, false); assert.equal(state.reason, expected); assert.equal(await page.evaluate(() => clicks), 0);
});
test('a changed draft is not submitted as the requested prompt', async t => {
  const page = await fixture(t, actualSend); await page.locator('textarea').fill('another draft');
  assert.equal((await page.evaluate(sendControl, { prompt: 'hi', nonce: 'changed' })).reason, 'prompt_changed');
  assert.equal(await page.evaluate(() => clicks), 0);
});
test('mobile adapter waits for a delayed enabled send control and never presses Enter', async t => {
  const page = await fixture(t, actualSend.replace('ds-button--circle', 'ds-button--circle ds-button--disabled'));
  await page.evaluate(() => setTimeout(() => document.querySelector('[data-send]').classList.remove('ds-button--disabled'), 180));
  const adapter = new MobileBrowser(() => { throw new Error('Native Enter must not be called'); }, { pollMs: 20, sendControlTimeoutMs: 1000 });
  await adapter._submitComposer(page, null, { prompt: 'hi', deadline: Date.now() + 3000 });
  assert.equal(await page.evaluate(() => clicks), 1); assert.equal(await page.evaluate(() => enters), 0);
});
test('cancelling before a send button becomes ready never clicks it', async t => {
  const page = await fixture(t, '<button type="button" disabled data-send>发送</button>');
  const adapter = new MobileBrowser(() => {}, { pollMs: 20, sendControlTimeoutMs: 1000 });
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 60); t.after(() => clearTimeout(timer));
  await assert.rejects(adapter._submitComposer(page, null, { prompt: 'hi', signal: controller.signal, deadline: Date.now() + 3000 }), error => error.code === 'REQUEST_CANCELLED');
  assert.equal(await page.evaluate(() => clicks), 0);
});
test('a click without webpage acceptance fails explicitly and is not retried', async t => {
  const page = await fixture(t, actualSend, { sticky: true });
  const adapter = new MobileBrowser(() => {}, { pollMs: 20 }); adapter._activeRequest = { phase: 'submitting' };
  const before = await adapter._readState(page);
  await adapter._submitComposer(page, null, { prompt: 'hi', deadline: Date.now() + 7000 });
  await assert.rejects(adapter._waitSubmission(page, before, 'hi', undefined, Date.now() + 7000), error => error.code === 'webpage_submission_failed');
  assert.equal(await page.evaluate(() => clicks), 1); assert.equal(await page.evaluate(() => enters), 0);
});
