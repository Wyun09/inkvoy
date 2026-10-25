import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

test('packaged engine boots under its CSP and completes a round trip through the native adapter contract', async t => {
  const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  t.after(() => browser.close());
  const context = await browser.newContext();
  const remote = await context.newPage();
  const fixture = `<!doctype html><meta charset="utf-8"><textarea placeholder="Message DeepSeek"></textarea><textarea hidden>artifact</textarea><div role="button" aria-pressed="false">深度思考</div><section id="reply"></section><script>
    document.querySelector('textarea').addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault(); event.target.value='';
      document.querySelector('#reply').innerHTML='<div class="ds-message"><div class="ds-markdown ds-assistant-message-main-content"><pre>MOBILE_</pre></div></div>';
      setTimeout(() => { document.querySelector('pre').textContent='MOBILE_RUNTIME_OK'; document.querySelector('#reply').insertAdjacentHTML('beforeend','<div role="button" aria-label="朗读">done</div>'); }, 180);
    });
  </script>`;
  await remote.route('https://chat.deepseek.com/**', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: fixture }));
  await remote.goto('https://chat.deepseek.com/');
  const engine = await context.newPage();
  const assets = new URL('../app/src/main/assets/', import.meta.url);
  await engine.route('https://bridge.local/**', async route => {
    const name = new URL(route.request().url()).pathname.slice(1);
    if (!['engine.html', 'engine.bundle.js', 'app.css', 'logo.png'].includes(name)) return route.abort();
    return route.fulfill({ contentType: name.endsWith('.png') ? 'image/png' : name.endsWith('.js') ? 'application/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8', body: await readFile(new URL(name, assets)) });
  });
  await engine.exposeBinding('__nativeRequest', async (_source, id, operation, raw) => {
    try {
      const argument = JSON.parse(raw); let value;
      if (operation === 'navigate') { await remote.goto(argument.url); value = true; }
      else if (operation === 'evaluate') value = await remote.evaluate(async ({ source, argument }) => await (0, eval)(`(${source})`)(argument), argument);
      else if (operation === 'enter') { await remote.keyboard.press('Enter'); value = true; }
      else throw new Error('Unexpected native RPC: ' + operation);
      await engine.evaluate(({ id, value }) => AndroidEngine.rpc(id, { ok: true, value }), { id, value });
    } catch (error) { await engine.evaluate(({ id, message }) => AndroidEngine.rpc(id, { ok: false, error: { code: 'PAGE_CHANGED', status: 502, message } }), { id, message: error.message }); }
  });
  await engine.addInitScript(() => {
    const nativeSet = window.setTimeout.bind(window), nativeClear = window.clearTimeout.bind(window);
    const timers = new Map(); window.nativeFrames = [];
    window.NativeBridge = {
      ready() { window.nativeReady = true; },
      timer(id, ms) { timers.set(id, nativeSet(() => { timers.delete(id); AndroidEngine.timer(id); }, ms)); },
      clearTimer(id) { nativeClear(timers.get(id)); timers.delete(id); },
      request(id, operation, raw) { void window.__nativeRequest(id, operation, raw); },
      response(id, kind, raw) { window.nativeFrames.push({ id, kind, payload: JSON.parse(raw) }); },
      reportUi(kind, raw) { if (kind === 'inspection') window.nativeInspection = JSON.parse(raw); },
    };
  });
  await engine.goto('https://bridge.local/engine.html');
  await engine.waitForFunction(() => window.nativeReady === true);
  assert.equal(await engine.evaluate(() => isSecureContext), true);
  await engine.evaluate(() => AndroidEngine.receive({ id: 'bundle-roundtrip', path: '/v1/chat/completions', body: { model: 'deepseek-web', messages: [{ role: 'user', content: 'Fixture response only.' }], stream: true, stream_options: { include_usage: true } } }));
  await engine.waitForFunction(() => window.nativeFrames.some(frame => frame.kind === 'end'), { timeout: 15000 });
  const frames = await engine.evaluate(() => window.nativeFrames);
  const chunks = frames.flatMap(frame => frame.kind === 'data' ? frame.payload.text.split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6))) : []);
  assert.ok(!chunks.some(chunk => chunk.error));
  assert.equal(chunks.flatMap(chunk => chunk.choices || []).map(choice => choice.delta.content || '').join(''), 'MOBILE_RUNTIME_OK');
  assert.equal(chunks.at(-1).usage_meta.cache.status, 'unknown');
  assert.ok(frames.some(frame => frame.payload.text === 'data: [DONE]\n\n'));
  await engine.evaluate(() => AndroidEngine.inspect());
  const inspection = await engine.evaluate(() => window.nativeInspection);
  assert.equal(inspection.loggedIn, true); assert.equal(inspection.reasoningMode.enabled, false);
});
