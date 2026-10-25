import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { conversationDom } from '../js/conversation-dom.js';
import { MobileBrowser } from '../js/mobile-browser.js';
import { createEngine } from '../js/engine.js';

let browser;
before(async () => { browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); });
after(async () => { await browser?.close(); });
const reply = (text, toolbar = true) => `<section class="turn"><div class="ds-message"><div class="ds-think-content">thought ${text}</div><div class="ds-markdown ds-assistant-message-main-content"><pre>${text}</pre></div></div>${toolbar ? '<div aria-label="朗读" role="button">done</div>' : ''}</section>`;
async function fixture(t, html) {
  const page = await browser.newPage(); t.after(() => page.close());
  await page.route('https://chat.deepseek.com/**', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><main id="log">' + html + '</main><textarea placeholder="Message DeepSeek"></textarea>' }));
  await page.goto('https://chat.deepseek.com/a/chat/s/task-1'); return page;
}

test('turn boundary excludes previous answers, thoughts and completion toolbars', async t => {
  const page = await fixture(t, reply('OLD_ANSWER'));
  const adapter = new MobileBrowser(() => {});
  adapter._turnBoundary = await page.evaluate(conversationDom, { nonce: 'turn-check' });
  let state = await adapter._readState(page);
  assert.equal(state.answerCount, 0); assert.equal(state.reasoningCount, 0); assert.equal(state.completed, false);
  await page.locator('#log').evaluate((node, html) => node.insertAdjacentHTML('beforeend', html), reply('NEW_ANSWER', false));
  state = await adapter._readState(page);
  assert.equal(state.answerCount, 1); assert.equal(state.text, 'NEW_ANSWER'); assert.equal(state.reasoningText, 'thought NEW_ANSWER'); assert.equal(state.completed, false);
  await page.locator('.turn').last().evaluate(node => node.insertAdjacentHTML('beforeend', '<div role="button" aria-label="朗读">new done</div>'));
  assert.equal((await adapter._readState(page)).completed, true);
});

test('shared wrapper cannot finish a new turn using an old toolbar', async t => {
  const page = await fixture(t, '<section id="shared"><div class="ds-message"><div class="ds-markdown ds-assistant-message-main-content"><pre>OLD</pre></div></div><div role="button" aria-label="朗读">old done</div></section>');
  const adapter = new MobileBrowser(() => {}); adapter._turnBoundary = await page.evaluate(conversationDom, { nonce: 'shared' });
  await page.locator('#shared').evaluate(node => node.insertAdjacentHTML('beforeend', '<div class="ds-message"><div class="ds-markdown ds-assistant-message-main-content"><pre>NEW</pre></div></div>'));
  assert.equal((await adapter._readState(page)).completed, false);
  await page.locator('#shared').evaluate(node => node.insertAdjacentHTML('beforeend', '<div role="button" aria-label="朗读">new done</div>'));
  const state = await adapter._readState(page); assert.equal(state.text, 'NEW'); assert.equal(state.completed, true);
});

test('historical DOM replacement is recovered only when the fingerprint matches', async t => {
  const page = await fixture(t, reply('OLD'));
  const adapter = new MobileBrowser(() => {}); adapter._turnBoundary = await page.evaluate(conversationDom, { nonce: 'replace' });
  await page.locator('#log').evaluate((node, html) => { node.innerHTML = html; }, reply('OLD') + reply('NEW'));
  let state = await adapter._readState(page); assert.equal(state.turnValid, true); assert.equal(state.text, 'NEW');
  await page.locator('.ds-assistant-message-main-content').first().evaluate(node => { node.removeAttribute('data-local-bridge-history'); node.textContent = 'DIFFERENT_HISTORY'; });
  state = await adapter._readState(page); assert.equal(state.turnValid, false); assert.equal(state.text, '');
  assert.throws(() => adapter._checkState(state, 'prompt'), error => error.code === 'conversation_changed');
});

test('new reasoning streams before its answer while historical reasoning stays excluded', async t => {
  const page = await fixture(t, reply('OLD'));
  const adapter = new MobileBrowser(() => {}); adapter._turnBoundary = await page.evaluate(conversationDom, { nonce: 'new-thinking' });
  await page.locator('#log').evaluate(node => node.insertAdjacentHTML('beforeend', '<section><div class="ds-message"><div class="ds-think-content"><p>NEW THINKING</p></div></div></section>'));
  const state = await adapter._readState(page); assert.equal(state.answerCount, 0); assert.equal(state.reasoningCount, 1); assert.equal(state.reasoningText, 'NEW THINKING'); assert.equal(state.completed, false);
});

test('URL changes and missing historical anchors fail before exposing any reply', async t => {
  const page = await fixture(t, reply('OLD'));
  const adapter = new MobileBrowser(() => {}); adapter._turnBoundary = await page.evaluate(conversationDom, { nonce: 'path-check' });
  await page.evaluate(() => history.pushState({}, '', '/a/chat/s/another-task'));
  assert.equal((await adapter._readState(page)).turnValid, false);
  await page.evaluate(() => { history.pushState({}, '', '/a/chat/s/task-1'); document.querySelector('#log').innerHTML = ''; });
  assert.equal((await adapter._readState(page)).turnValid, false);
});

test('restoring a conversation waits for delayed history instead of starting a new chat', async t => {
  const page = await fixture(t, reply('RESTORED'));
  const saved = await page.evaluate(conversationDom, { action: 'inspect' });
  await page.locator('#log').evaluate((node, html) => { node.innerHTML = ''; setTimeout(() => { node.innerHTML = html; }, 150); }, reply('RESTORED'));
  const adapter = new MobileBrowser(() => {}, { pollMs: 20 });
  const opened = await adapter._openConversation(page, { ...saved, reuse: true }, undefined, Date.now() + 5000);
  assert.equal(opened.reused, true); assert.equal(new URL(page.url()).pathname, saved.path);
});

test('an unsent user draft is preserved even when a new API task arrives', async t => {
  const page = await fixture(t, reply('OLD'));
  await page.locator('textarea').fill('MY_UNSENT_DRAFT');
  const adapter = new MobileBrowser(() => {});
  await assert.rejects(adapter._openConversation(page, undefined, undefined, Date.now() + 5000), error => error.code === 'conversation_has_draft');
  assert.equal(await page.locator('textarea').inputValue(), 'MY_UNSENT_DRAFT'); assert.ok(page.url().endsWith('/a/chat/s/task-1'));
});

const website = `<!doctype html><meta charset="utf-8"><form><textarea placeholder="Message DeepSeek"></textarea><div role="button" aria-pressed="false" id="think">深度思考</div><div role="button" aria-pressed="false" id="search">智能搜索</div><button type="button" id="send" aria-label="发送消息">↑</button></form><main id="log"></main><script>
  const store=()=>JSON.parse(sessionStorage.getItem('chats')||'{}');
  let turns=store()[location.pathname]||[];
  function render(){document.querySelector('#log').innerHTML=turns.map(text=>'<section><div class="ds-message"><div class="ds-markdown ds-assistant-message-main-content"><pre></pre></div></div><div role="button" aria-label="朗读">done</div></section>').join('');document.querySelectorAll('pre').forEach((node,index)=>node.textContent=turns[index]);}
  render();
  for(const id of ['think','search'])document.getElementById(id).onclick=event=>event.currentTarget.setAttribute('aria-pressed',event.currentTarget.getAttribute('aria-pressed')!=='true');
  document.querySelector('#send').onclick=()=>{
    const input=document.querySelector('textarea'),prompt=input.value;input.value='';
    const prompts=JSON.parse(sessionStorage.getItem('prompts')||'[]');prompts.push(prompt);sessionStorage.setItem('prompts',JSON.stringify(prompts));
    if(location.pathname==='/'){const n=Number(sessionStorage.getItem('created')||0)+1;sessionStorage.setItem('created',n);history.pushState({},'','/a/chat/s/task-'+n);}
    const suffix=prompt.includes('RESULT_A')?'A2':prompt.includes('TASK_B')?'B1':prompt.includes('NEXT_A')?'A3':'A1';
    const section=document.createElement('section');section.innerHTML='<div class="ds-message"><div class="ds-markdown ds-assistant-message-main-content"><pre></pre></div></div>';document.querySelector('#log').append(section);
    setTimeout(()=>{section.querySelector('pre').textContent=suffix;turns.push(suffix);const chats=store();chats[location.pathname]=turns;sessionStorage.setItem('chats',JSON.stringify(chats));section.insertAdjacentHTML('beforeend','<div role="button" aria-label="朗读">new done</div>');},240);
  };
</script>`;

test('real DOM engine round trips reuse a task, switch between tasks, and send only new messages', async t => {
  const context = await browser.newContext(); t.after(() => context.close());
  const page = await context.newPage(); let navigations = 0;
  await page.route('https://chat.deepseek.com/**', route => { navigations++; return route.fulfill({ contentType: 'text/html; charset=utf-8', body: website }); });
  await page.goto('https://chat.deepseek.com/');
  const rpc = async (operation, argument) => {
    if (operation === 'navigate') { await page.goto(argument.url); return true; }
    if (operation === 'evaluate') return page.evaluate(async ({ source, argument }) => (0, eval)('(' + source + ')')(argument), argument);
    if (operation === 'resetBrowser') { await page.goto('https://chat.deepseek.com/'); return true; }
    throw new Error('Unexpected operation: ' + operation);
  };
  const backend = new MobileBrowser(rpc, { pollMs: 30 });
  let resolve, seq = 0;
  const engine = createEngine(backend, (_id, kind, payload) => { if (kind === 'response') resolve(payload); });
  const submit = messages => new Promise(done => { resolve = done; engine.receive({ id: String(++seq), path: '/v1/chat/completions', body: { model: 'deepseek-web', messages } }); });
  const a = { role: 'user', content: 'TASK_A_INITIAL' };
  let result = await submit([a]); assert.equal(result.status, 200); const first = result.body.choices[0].message; assert.equal(first.content, 'A1');
  const navBefore = navigations;
  result = await submit([a, first, { role: 'user', content: 'RESULT_A' }]); assert.equal(result.status, 200); assert.equal(result.body.choices[0].message.content, 'A2'); assert.equal(navigations, navBefore, 'Continuation on the current page must not navigate or create a chat');
  const second = result.body.choices[0].message;
  result = await submit([{ role: 'user', content: 'TASK_B' }]); assert.equal(result.status, 200); assert.equal(result.body.choices[0].message.content, 'B1');
  result = await submit([a, first, { role: 'user', content: 'RESULT_A' }, second, { role: 'user', content: 'NEXT_A' }]);
  assert.equal(result.status, 200); assert.equal(result.body.choices[0].message.content, 'A3');
  assert.equal(await page.evaluate(() => Number(sessionStorage.getItem('created'))), 2, 'Four calls across two tasks create exactly two website chats');
  const prompts = await page.evaluate(() => JSON.parse(sessionStorage.getItem('prompts')));
  assert.ok(!prompts[1].includes('TASK_A_INITIAL')); assert.ok(!prompts[3].includes('TASK_A_INITIAL')); assert.ok(!prompts[3].includes('TASK_B'));
  assert.equal(engine.conversationState().reused, 2); assert.equal(engine.conversationState().created, 2);
  const third = result.body.choices[0].message;
  await page.locator('#log').evaluate(node => { node.innerHTML = ''; });
  result = await submit([a, first, { role: 'user', content: 'RESULT_A' }, second, { role: 'user', content: 'NEXT_A' }, third, { role: 'user', content: 'AFTER_LOST_HISTORY' }]);
  assert.equal(result.status, 200); assert.equal(result.body.usage_meta.conversation.reused, false);
  const recoveredPrompt = await page.evaluate(() => JSON.parse(sessionStorage.getItem('prompts')).at(-1));
  for (const text of ['TASK_A_INITIAL', 'RESULT_A', 'NEXT_A', 'AFTER_LOST_HISTORY']) assert.ok(recoveredPrompt.includes(text), 'Fallback must preserve the entire API history');
  assert.equal(await page.evaluate(() => Number(sessionStorage.getItem('created'))), 3);
  assert.equal(engine.resetConversations(), true); assert.equal(engine.conversationState().tracked, 0);
  assert.equal(await page.evaluate(() => Object.keys(JSON.parse(sessionStorage.getItem('chats'))).length), 3, 'Reset preserves website history');
});
