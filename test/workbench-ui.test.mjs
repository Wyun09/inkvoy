import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { uiHarness, workbenchState } from './ui-harness.mjs';

test('task workbench filters actual states, opens live timelines, cancels and recovers sessions', async t => {
  const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); t.after(() => browser.close());
  const { page, context } = await uiHarness(browser); t.after(() => context.close());
  await page.evaluate(state => BridgeDashboard.render(state), workbenchState);
  assert.equal(await page.locator('#metric-requests').textContent(), '28'); assert.equal(await page.locator('#metric-first').textContent(), '3.8s');
  assert.match(await page.locator('#storage-label').textContent(), /加密保存/);
  await page.locator('.bottom-nav [data-navigate="tasks"]').click();
  assert.equal(await page.locator('#task-list .task-card').count(), 4);
  await page.locator('[data-filter="attention"]').click(); assert.equal(await page.locator('#task-list .task-card').count(), 1);
  await page.locator('[data-task="task_retry"]').click();
  assert.match(await page.locator('#sheet-body').innerText(), /PAGE_CHANGED/);
  await page.getByRole('button', { name: '重试本次请求', exact: true }).click();
  assert.ok((await page.evaluate(() => nativeActions)).some(item => item.action === 'task-retry' && item.payload.id === 'task_retry'));
  await page.locator('[data-filter="active"]').click(); assert.equal(await page.locator('#task-list .task-card').count(), 2);
  await page.locator('[data-task="task_scene"]').click(); assert.ok(await page.locator('.timeline li').count() > 3);
  await page.getByRole('button', { name: '取消本次请求', exact: true }).click();
  assert.ok((await page.evaluate(() => nativeActions)).some(item => item.action === 'task-cancel' && item.payload.id === 'task_scene'));
  await page.evaluate(state => { state.taskboard.tasks[0].state = 'cancelled'; state.taskboard.tasks[0].phase = 'cancelled'; state.taskboard.tasks[0].cancelAvailable = false; BridgeDashboard.render(state); }, workbenchState);
  assert.equal(await page.getByRole('button', { name: '取消本次请求', exact: true }).count(), 0); assert.match(await page.locator('#sheet-body').innerText(), /已取消/);
  await page.locator('#close-sheet').click();
  await page.locator('[data-board="sessions"]').click(); assert.equal(await page.locator('#session-list .session-card').count(), 3);
  await page.locator('[data-session="1"]').click(); assert.equal(await page.getByRole('button', { name: '打开原会话', exact: true }).isDisabled(), true);
  await page.locator('#close-sheet').click(); await page.evaluate(() => BridgeDashboard.render({ busy: false }));
  await page.locator('[data-session="1"]').click(); await page.getByRole('button', { name: '打开原会话', exact: true }).click();
  await page.locator('[data-session="2"]').click(); await page.getByRole('button', { name: '移除关联', exact: true }).click();
  const actions = await page.evaluate(() => nativeActions); assert.ok(actions.some(item => item.action === 'session-open' && item.payload.id === '1')); assert.ok(actions.some(item => item.action === 'session-forget' && item.payload.id === '2'));
});

test('tool task retry returns to its client, response display treats tool payloads as inert text', async t => {
  const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); t.after(() => browser.close());
  const { page, context } = await uiHarness(browser); t.after(() => context.close());
  await page.evaluate(state => { state.taskboard.tasks[2].localRetryAvailable = false; BridgeDashboard.render(state); }, workbenchState);
  await page.locator('.bottom-nav [data-navigate="tasks"]').click(); await page.locator('[data-task="task_retry"]').click();
  await page.getByRole('button', { name: '查看重试方式', exact: true }).click();
  assert.match(await page.locator('#sheet-body').innerText(), /原客户端/); assert.ok(!(await page.evaluate(() => nativeActions)).some(item => item.action === 'task-retry'));
  await page.locator('#close-sheet').click();
  await page.evaluate(() => BridgeDashboard.showResult([{ kind: 'response', payload: { body: { choices: [{ message: { content: '<img src=x onerror="window.injected=true">', tool_calls: [{ id: 'original-call' }] } }] } } }]));
  assert.match(await page.locator('.result-pre').innerText(), /original-call/); assert.equal(await page.locator('.result-pre img').count(), 0); assert.equal(await page.evaluate(() => window.injected), undefined);
});

test('workbench navigation, mode buttons and touch targets fit 320px phones and wide screens', async t => {
  const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); t.after(() => browser.close());
  for (const width of [320, 768]) {
    const { page, context } = await uiHarness(browser, { width, height: 844 });
    await page.evaluate(state => BridgeDashboard.render(state), workbenchState);
    for (const tab of ['home', 'tasks', 'web', 'connect']) {
      await page.locator('.bottom-nav [data-navigate="' + tab + '"]').click();
      const bad = await page.evaluate(() => [...document.querySelectorAll('button')].filter(node => node.getClientRects().length).filter(node => node.getBoundingClientRect().width < 43.5 || node.getBoundingClientRect().height < 43.5).map(node => node.textContent)); assert.deepEqual(bad, []);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.locator('[data-agent="compatible"]').click(); assert.ok((await page.evaluate(() => nativeActions)).some(item => item.action === 'agent-policy' && item.payload.enabled === false));
    await page.evaluate(() => BridgeDashboard.render({ agentStrict: false, storage: { available: false, reason: 'write_failed' } }));
    assert.equal(await page.locator('[data-agent="compatible"]').getAttribute('aria-pressed'), 'true');
    await page.locator('.bottom-nav [data-navigate="home"]').click(); assert.match(await page.locator('#storage-label').innerText(), /无法持久/);
    await context.close();
  }
});
