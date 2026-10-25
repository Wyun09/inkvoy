import { readFile } from 'node:fs/promises';
export async function uiHarness(browser, viewport = { width: 390, height: 844 }, { storage = 'enabled', failStartup = false } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const assets = new URL('../app/src/main/assets/', import.meta.url);
  await page.route('https://bridge.local/**', async route => {
    const name = new URL(route.request().url()).pathname.slice(1);
    if (!['engine.html', 'engine.bundle.js', 'app.css', 'logo.png'].includes(name)) return route.abort();
    return route.fulfill({ contentType: name.endsWith('.png') ? 'image/png' : name.endsWith('.js') ? 'application/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8', body: await readFile(new URL(name, assets)) });
  });
  await page.addInitScript(({ storage, failStartup }) => {
    if (failStartup) window.ResizeObserver = class { constructor() { throw new Error('ResizeObserver unavailable'); } };
    if (storage === 'disabled') Object.defineProperty(window, 'localStorage', { get: () => null });
    if (storage === 'blocked') Object.defineProperty(window, 'localStorage', { get: () => { throw new DOMException('Storage access denied', 'SecurityError'); } });
    if (storage === 'read-only') Object.defineProperty(window, 'localStorage', { get: () => ({ getItem: () => null, setItem: () => { throw new DOMException('Storage full', 'QuotaExceededError'); } }) });
    const set = window.setTimeout.bind(window), clear = window.clearTimeout.bind(window), timers = new Map();
    window.nativeActions = []; window.nativeLayouts = []; window.nativeStartupErrors = [];
    window.NativeBridge = {
      ready() { window.nativeReady = true; },
      timer(id, ms) { timers.set(id, set(() => { timers.delete(id); AndroidEngine.timer(id); }, ms)); },
      clearTimer(id) { clear(timers.get(id)); timers.delete(id); },
      uiAction(action, raw) { window.nativeActions.push({ action, payload: JSON.parse(raw) }); },
      uiLayout(raw) { window.nativeLayouts.push(JSON.parse(raw)); },
      startupError(message) { window.nativeStartupErrors.push(message); },
      searchDefault() { return true; },
      request() {}, response() {}, reportUi() {},
    };
  }, { storage, failStartup });
  await page.goto('https://bridge.local/engine.html');
  await page.waitForFunction(failStartup => failStartup ? window.nativeStartupErrors?.length > 0 : window.nativeReady && window.BridgeDashboard, failStartup, { timeout: 5000 });
  return { context, page };
}
export const readyState = { version: '1.0.0', ready: true, running: true, loggedIn: true, hasInspection: true, inspecting: false, needsVerification: false, reasoningMode: { count: 1, enabled: false, source: 'ds_toggle_component' }, webSearchDefault: true, webSearchMode: { count: 1, enabled: true, source: 'aria-pressed' }, requests: 0, busy: false, testStatus: 'passed', probeRunning: false, activities: [{ text: '本机服务已启动', time: '09:41' }, { text: '网页登录已确认', time: '09:42' }, { text: '接口自测通过', time: '09:42' }] };

// Deterministic display fixtures, never included in the production UI bundle.
const fixtureTime = new Date('2026-10-17T09:42:00+08:00').getTime();
function fixtureTask(id, title, state, phase, extra = {}) {
  return { id, title, state, phase, protocol: 'Anthropic', createdAt: fixtureTime - 90000, updatedAt: fixtureTime, requestCount: 4, toolsOffered: 3, reused: 3, firstOutputMs: 3800, cancelAvailable: state === 'running', resultAvailable: state !== 'running', retryAvailable: false, localRetryAvailable: false,
    events: [{ time: fixtureTime - 90000, phase: 'queued', text: '等待处理' }, { time: fixtureTime - 89000, phase: 'resuming_conversation', text: '恢复原会话' }, { time: fixtureTime - 87000, phase: 'submitting', text: '发送消息' }, { time: fixtureTime - 83000, phase: 'thinking', text: '正在思考' }, { time: fixtureTime - 60000, phase: 'waiting_tools', text: '等待客户端工具结果' }, { time: fixtureTime, phase, text: ({ thinking: '正在思考', failed: '处理失败', completed: '已完成', waiting_tools: '等待客户端工具结果' })[phase] || phase }], ...extra };
}
export const workbenchState = { ...readyState, busy: true, agentStrict: true, storage: { available: true, encrypted: true, reason: 'ready' }, conversations: { tracked: 3, created: 3, reused: 18 },
  taskboard: { totalRequests: 28, active: 1, completed: 1, failed: 1, firstOutputMs: 3800,
    tasks: [fixtureTask('task_scene', '完善 Three.js 场景与移动端性能', 'running', 'thinking'),
      fixtureTask('task_tools', '整理项目结构，补齐缺失的配置', 'waiting_tools', 'waiting_tools', { requestCount: 2, toolsOffered: 2, reused: 1 }),
      fixtureTask('task_retry', '检查构建结果，修复类型错误', 'failed', 'failed', { protocol: 'OpenAI', requestCount: 1, toolsOffered: 0, reused: 0, retryAvailable: true, localRetryAvailable: true, lastError: { code: 'PAGE_CHANGED', message: '网页连接中断，可检查网页后重试。' } }),
      fixtureTask('task_done', '完成首页布局与明暗主题', 'completed', 'completed', { requestCount: 6, toolsOffered: 5, reused: 5 })],
    sessions: [{ id: '1', taskId: 'task_scene', turns: 4, messages: 12, used: fixtureTime }, { id: '2', taskId: 'task_tools', turns: 2, messages: 6, used: fixtureTime - 900000 }, { id: '3', taskId: 'task_done', turns: 6, messages: 20, used: fixtureTime - 3600000 }] } };
