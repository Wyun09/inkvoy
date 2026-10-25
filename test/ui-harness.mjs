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
      request() {}, response() {}, reportUi() {},
    };
  }, { storage, failStartup });
  await page.goto('https://bridge.local/engine.html');
  await page.waitForFunction(failStartup => failStartup ? window.nativeStartupErrors?.length > 0 : window.nativeReady && window.BridgeDashboard, failStartup, { timeout: 5000 });
  return { context, page };
}
export const readyState = { version: '0.2.1', ready: true, running: true, loggedIn: true, hasInspection: true, inspecting: false, needsVerification: false, reasoningMode: { count: 1, enabled: false, source: 'ds_toggle_component' }, requests: 0, busy: false, testStatus: 'passed', probeRunning: false, activities: [{ text: '本机服务已启动', time: '09:41' }, { text: '网页登录已确认', time: '09:42' }, { text: '接口自测通过', time: '09:42' }] };
