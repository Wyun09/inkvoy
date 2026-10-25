import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

test('packaged engine boots under its CSP and completes a round trip through the native adapter contract', async t => {
  const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  t.after(() => browser.close());
  const context = await browser.newContext();
  const remote = await context.newPage();
  const fixture = `<!doctype html><meta charset="utf-8"><form><textarea placeholder="Message DeepSeek"></textarea><textarea hidden>artifact</textarea><div role="button" aria-pressed="false">深度思考</div><div tabindex="0" aria-pressed="false" id="search">智能搜索</div><button type="button" aria-label="发送消息" id="send">↑</button></form><section id="reply"></section><script>
    window.sendClicks=0;window.enterPresses=0;
    document.querySelector('#search').addEventListener('click',event=>event.currentTarget.setAttribute('aria-pressed',event.currentTarget.getAttribute('aria-pressed')!=='true'));
    document.querySelector('textarea').addEventListener('keydown', event => { if(event.key==='Enter')window.enterPresses++; });
    document.querySelector('#send').addEventListener('click', () => {
      window.sendClicks++;document.querySelector('textarea').value='';
      if(location.pathname==='/'){const n=Number(sessionStorage.getItem('created')||0)+1;sessionStorage.setItem('created',n);history.pushState({},'','/a/chat/s/bundle-'+n);}
      const message=document.createElement('div');message.className='ds-message';message.innerHTML='<div class="ds-markdown ds-assistant-message-main-content"><pre>MOBILE_</pre></div>';document.querySelector('#reply').append(message);
      setTimeout(() => { message.querySelector('pre').textContent='MOBILE_RUNTIME_OK'; document.querySelector('#reply').insertAdjacentHTML('beforeend','<div role="button" aria-label="朗读">done</div>'); }, 180);
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
      else if (operation === 'enter') throw new Error('Mobile Enter is not a reliable submit action.');
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
  await engine.waitForFunction(() => window.nativeFrames.some(frame => frame.kind === 'end' || frame.kind === 'response'), null, { timeout: 15000 });
  const frames = await engine.evaluate(() => window.nativeFrames);
  const chunks = frames.flatMap(frame => frame.kind === 'data' ? frame.payload.text.split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6))) : []);
  assert.ok(!chunks.some(chunk => chunk.error));
  assert.equal(chunks.flatMap(chunk => chunk.choices || []).map(choice => choice.delta.content || '').join(''), 'MOBILE_RUNTIME_OK');
  assert.equal(chunks.at(-1).usage_meta.cache.status, 'unknown');
  assert.ok(frames.some(frame => frame.payload.text === 'data: [DONE]\n\n'));
  await engine.evaluate(() => AndroidEngine.inspect());
  const inspection = await engine.evaluate(() => window.nativeInspection);
  assert.equal(inspection.loggedIn, true); assert.equal(inspection.reasoningMode.enabled, false);
  assert.equal(inspection.webSearchMode.enabled, true);
  assert.equal(await remote.evaluate(() => sendClicks), 1);
  assert.equal(await remote.evaluate(() => enterPresses), 0);
  await engine.evaluate(() => AndroidEngine.receive({ id: 'bundle-continuation', path: '/v1/chat/completions', body: { model: 'deepseek-web', messages: [{ role: 'user', content: 'Fixture response only.' }, { role: 'assistant', content: 'MOBILE_RUNTIME_OK' }, { role: 'user', content: 'Continuation only.' }] } }));
  await engine.waitForFunction(() => window.nativeFrames.some(frame => frame.id === 'bundle-continuation' && frame.kind === 'response'), null, { timeout: 15000 });
  const continuation = await engine.evaluate(() => window.nativeFrames.find(frame => frame.id === 'bundle-continuation' && frame.kind === 'response'));
  assert.equal(continuation.payload.status, 200); assert.equal(continuation.payload.body.choices[0].message.content, 'MOBILE_RUNTIME_OK');
  assert.equal(continuation.payload.body.usage_meta.conversation.reused, true); assert.equal(continuation.payload.body.usage_meta.conversation.sent_messages, 1);
  assert.equal(await remote.evaluate(() => Number(sessionStorage.getItem('created'))), 1);
  assert.equal(await remote.evaluate(() => sendClicks), 2); assert.equal(await remote.evaluate(() => enterPresses), 0);
  await engine.evaluate(() => AndroidEngine.receive({ id: 'bundle-anthropic', path: '/v1/messages', body: { model: 'deepseek-web', max_tokens: 256, messages: [{ role: 'user', content: 'Fixture response only.' }], stream: true } }));
  await engine.waitForFunction(() => window.nativeFrames.some(frame => frame.id === 'bundle-anthropic' && (frame.kind === 'end' || frame.kind === 'response')), null, { timeout: 15000 });
  const anthropic = await engine.evaluate(() => window.nativeFrames.filter(frame => frame.id === 'bundle-anthropic'));
  const events = anthropic.flatMap(frame => frame.kind === 'data' ? frame.payload.text.split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6))) : []);
  assert.ok(!anthropic.some(frame => frame.kind === 'response' && frame.payload.status >= 400));
  assert.equal(events[0].type, 'message_start');
  assert.equal(events.filter(event => event.type === 'content_block_delta').map(event => event.delta.text || '').join(''), 'MOBILE_RUNTIME_OK');
  assert.equal(events.at(-1).type, 'message_stop');
  assert.equal(await remote.evaluate(() => Number(sessionStorage.getItem('created'))), 2, 'Independent history starts its own conversation');
  assert.equal(await remote.evaluate(() => sendClicks), 1, 'Each new fixture navigation submits exactly once');
  assert.equal(await remote.evaluate(() => enterPresses), 0);
  await engine.evaluate(() => AndroidEngine.receive({ id: 'bundle-count', path: '/v1/messages/count_tokens', body: { model: 'deepseek-web', messages: [{ role: 'user', content: 'Count without opening the webpage.' }] } }));
  await engine.waitForFunction(() => window.nativeFrames.some(frame => frame.id === 'bundle-count' && frame.kind === 'response'));
  const count = await engine.evaluate(() => window.nativeFrames.find(frame => frame.id === 'bundle-count' && frame.kind === 'response'));
  assert.ok(count.payload.body.input_tokens > 0); assert.equal(count.payload.body.usage_meta.estimated, true);
  assert.equal(await remote.evaluate(() => sendClicks), 1, 'Token estimates must not submit a prompt');
});
