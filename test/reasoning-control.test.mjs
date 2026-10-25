import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { reasoningControl } from '../js/core/reasoning-control.js';
import { DeepSeekBrowser } from '../js/core/browser.js';
let browser;
before(async () => { browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); });
after(async () => { await browser?.close(); });
async function fixture(t, html) {
  const page = await browser.newPage(); t.after(() => page.close());
  await page.route('https://chat.deepseek.com/**', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><script>window.clicks=0</script>' + html }));
  await page.goto('https://chat.deepseek.com/'); return page;
}
for (const [name, html, expected, source] of [
  ['pressed attribute with nested text', '<button aria-pressed="false"><span>深度思考</span></button>', false, 'aria-pressed'],
  ['checked switch with DeepThink R1', '<div role="switch" aria-checked="true"><span>DeepThink (R1)</span></div>', true, 'aria-checked'],
  ['mobile component off without ARIA', '<div tabindex="0" class="ds-toggle-button"><span>深度思考</span></div>', false, 'ds_toggle_component'],
  ['mobile component selected without ARIA', '<div class="ds-toggle-button ds-toggle-button--selected"><span>深度思考</span></div>', true, 'ds_toggle_component'],
  ['explicit active data state', '<button data-state="active">思考模式</button>', true, 'data-state'],
  ['inactive is not mistaken for active', '<button data-state="inactive">Deep Think</button>', false, 'data-state'],
  ['boolean selected marker', '<button data-selected="false">深度思考（R1）</button>', false, 'data-selected'],
  ['native checkbox label', '<label><input type="checkbox" checked>深度思考</label>', true, 'native_checkbox'],
  ['native checkbox accessible name', '<input type="checkbox" aria-label="深度思考">', false, 'native_checkbox'],
  ['state carried by a nested span', '<button><span aria-pressed="true">DeepThink</span></button>', true, 'aria-pressed'],
  ['accessible name on icon button', '<button aria-label="深度思考" aria-checked="false"><svg></svg></button>', false, 'aria-checked'],
  ['explicit selected class', '<button class="is-selected">Thinking mode</button>', true, 'explicit_state_class'],
  ['explicit inactive class', '<button class="inactive">思考</button>', false, 'explicit_state_class'],
  ['explicit label mode', '<button>深度思考：开启</button>', true, 'explicit_label'],
  ['selected thinking tab', '<button role="tab" aria-selected="true">深度思考</button>', true, 'aria-selected'],
]) test('reasoning detection: ' + name, async t => {
  const page = await fixture(t, html); const state = await page.evaluate(reasoningControl, { action: 'read' });
  assert.equal(state.count, 1); assert.equal(state.enabled, expected); assert.equal(state.source, source);
});
test('class-only mobile control switches both ways and repeated requests do not click again', async t => {
  const page = await fixture(t, '<div tabindex="0" class="ds-toggle-button" onclick="window.clicks++;this.classList.toggle(\'ds-toggle-button--selected\')"><span>深度思考</span></div>');
  const adapter = new DeepSeekBrowser({ profileDir: 'unused-reasoning-fixture', pollMs: 20 });
  await adapter._setReasoning(page, true, undefined, Date.now() + 3000);
  await adapter._setReasoning(page, true, undefined, Date.now() + 3000);
  assert.equal(await page.evaluate(() => window.clicks), 1);
  assert.equal((await adapter._readReasoningMode(page)).enabled, true);
  await adapter._setReasoning(page, false, undefined, Date.now() + 3000);
  assert.equal(await page.evaluate(() => window.clicks), 2);
  assert.equal((await adapter._readReasoningMode(page)).enabled, false);
});
test('hidden copies, old messages and popup wrappers do not produce extra controls', async t => {
  const page = await fixture(t, '<button hidden aria-pressed="true">深度思考</button><div class="ds-message"><button aria-pressed="true">深度思考</button></div><div data-state="open"><button>搜索</button><button aria-pressed="false"><span>深度思考</span></button></div>');
  const state = await page.evaluate(reasoningControl, {}); assert.equal(state.count, 1); assert.equal(state.enabled, false);
});
test('the control closest to the unique composer is preferred over a separate toolbar copy', async t => {
  const page = await fixture(t, '<aside><button aria-pressed="true">深度思考</button></aside><form><textarea placeholder="Message DeepSeek"></textarea><button aria-pressed="false">深度思考</button></form>');
  const state = await page.evaluate(reasoningControl, {}); assert.equal(state.count, 1); assert.equal(state.enabled, false);
});
test('ambiguous controls are not clicked', async t => {
  const page = await fixture(t, '<button aria-pressed="false" onclick="window.clicks++">深度思考</button><button aria-pressed="true" onclick="window.clicks++">深度思考</button>');
  const state = await page.evaluate(reasoningControl, { action: 'set', enabled: true }); assert.equal(state.count, 2); assert.equal(state.clicked, false); assert.equal(await page.evaluate(() => window.clicks), 0);
});
test('colours and missing arbitrary classes never become a guessed false state', async t => {
  const page = await fixture(t, '<button style="color:blue;background:#eee" onclick="window.clicks++">深度思考</button>');
  const state = await page.evaluate(reasoningControl, { action: 'set', enabled: false }); assert.equal(state.enabled, null); assert.equal(state.reason, 'state_not_exposed'); assert.equal(state.clicked, false);
});
test('contradictory ARIA states fail closed', async t => {
  const page = await fixture(t, '<button aria-pressed="true" aria-checked="false" onclick="window.clicks++">深度思考</button>');
  const state = await page.evaluate(reasoningControl, { action: 'set', enabled: true }); assert.equal(state.enabled, null); assert.equal(state.reason, 'conflicting_state'); assert.equal(state.clicked, false);
});
test('disabled controls are observed without clicking', async t => {
  const page = await fixture(t, '<button disabled aria-pressed="false" onclick="window.clicks++">深度思考</button>');
  const state = await page.evaluate(reasoningControl, { action: 'set', enabled: true }); assert.equal(state.disabled, true); assert.equal(state.clicked, false);
});
test('late-rendered toggle is found before the initial mode check fails', async t => {
  const page = await fixture(t, '<textarea></textarea><script>setTimeout(()=>{document.body.insertAdjacentHTML("beforeend",\'<button aria-pressed="false">深度思考</button>\')},180)</script>');
  const adapter = new DeepSeekBrowser({ profileDir: 'unused-reasoning-fixture' });
  await adapter._setReasoning(page, false, undefined, Date.now() + 3000);
});
test('an unresponsive toggle cannot claim a mode change', async t => {
  const page = await fixture(t, '<button aria-pressed="false" onclick="window.clicks++">深度思考</button>');
  const adapter = new DeepSeekBrowser({ profileDir: 'unused-reasoning-fixture', pollMs: 20 });
  await assert.rejects(adapter._setReasoning(page, true, undefined, Date.now() + 400), error => error.code === 'REQUEST_TIMEOUT' || error.code === 'reasoning_state_unknown');
  assert.equal(await page.evaluate(() => window.clicks), 1);
});
test('the same matching text outside an interactive control is not treated as a switch', async t => {
  const page = await fixture(t, '<p>深度思考</p>'); const state = await page.evaluate(reasoningControl, {}); assert.equal(state.count, 0);
});
test('disabling a thinking tab selects its explicit normal peer and confirms the final state', async t => {
  const page = await fixture(t, '<div role="tablist"><button role="tab" aria-selected="true" id="think" onclick="window.clicks++">深度思考</button><button role="tab" aria-selected="false" onclick="window.clicks++;document.querySelector(\'#think\').setAttribute(\'aria-selected\',\'false\');this.setAttribute(\'aria-selected\',\'true\')">快速</button></div>');
  const adapter = new DeepSeekBrowser({ profileDir: 'unused-reasoning-fixture' });
  await adapter._setReasoning(page, false, undefined, Date.now() + 3000);
  assert.equal((await adapter._readReasoningMode(page)).enabled, false); assert.equal(await page.evaluate(() => window.clicks), 1);
});
test('auto mode is not falsely treated as an explicit thinking-off tab', async t => {
  const page = await fixture(t, '<div role="tablist"><button role="tab" aria-selected="true" onclick="window.clicks++">深度思考</button><button role="tab" aria-selected="false" onclick="window.clicks++">自动</button></div>');
  const state = await page.evaluate(reasoningControl, { action: 'set', enabled: false }); assert.equal(state.clicked, false); assert.equal(state.reason, 'normal_mode_missing'); assert.equal(await page.evaluate(() => window.clicks), 0);
});
test('mixed ARIA and interactivity markers are not mistaken for reasoning on/off', async t => {
  const page = await fixture(t, '<button class="ds-toggle-button" aria-pressed="mixed" onclick="window.clicks++">深度思考</button>');
  const mixed = await page.evaluate(reasoningControl, { action: 'set', enabled: false });
  assert.equal(mixed.enabled, null); assert.equal(mixed.clicked, false);
  await page.setContent('<button data-state="disabled" onclick="window.clicks++">深度思考</button>');
  const disabled = await page.evaluate(reasoningControl, { action: 'set', enabled: false });
  assert.equal(disabled.enabled, null); assert.equal(disabled.clicked, false);
});
