import { MobileBrowser } from './mobile-browser.js';
import { createEngine } from './engine.js';
import { MobileBuffer } from './platform.js';
import { initDashboard } from './ui/dashboard.js';
globalThis.Buffer = MobileBuffer;
// Native handler timers keep the trusted engine's deadlines/heartbeats working
// when its tiny local WebView is not visually prominent. No timer privileges
// are exposed to the remote DeepSeek page.
const pendingTimers = new Map();
let sequence = 0;
globalThis.setTimeout = (fn, ms = 0, ...args) => {
  const id = ++sequence; pendingTimers.set(id, () => fn(...args)); NativeBridge.timer(id, Math.max(0, Number(ms) || 0)); return id;
};
globalThis.clearTimeout = id => { pendingTimers.delete(id); NativeBridge.clearTimer(id); };
globalThis.setInterval = (fn, ms = 0, ...args) => {
  const id = ++sequence;
  const tick = () => { fn(...args); if (pendingTimers.has(id)) NativeBridge.timer(id, Math.max(20, Number(ms) || 0)); };
  pendingTimers.set(id, tick); pendingTimers.get(id).interval = true;
  NativeBridge.timer(id, Math.max(20, Number(ms) || 0)); return id;
};
globalThis.clearInterval = globalThis.clearTimeout;
const pending = new Map();
const rpc = (operation, argument) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { pending.delete(id); reject(Object.assign(new Error('Android WebView 操作超时。'), { code: 'android_webview_timeout', status: 504 })); }, operation === 'navigate' ? 35000 : 10000);
  pending.set(id, { resolve, reject, timer });
  NativeBridge.request(id, operation, JSON.stringify(argument));
});
const backend = new MobileBrowser(rpc);
const engine = createEngine(backend, (id, kind, payload) => NativeBridge.response(id, kind, JSON.stringify(payload)), {
  defaultWebSearch: () => NativeBridge.searchDefault?.() ?? true,
});
let inspecting = false;
globalThis.AndroidEngine = {
  receive: request => engine.receive(request), cancel: id => engine.cancel(id),
  async inspect() {
    if (inspecting) return;
    inspecting = true;
    NativeBridge.reportUi?.('inspectionStart', '{}');
    try { NativeBridge.reportUi?.('inspection', JSON.stringify(await backend.status())); }
    catch { NativeBridge.reportUi?.('inspectionError', '{}'); }
    finally { inspecting = false; }
  },
  timer(id) { const fn = pendingTimers.get(id); if (!fn) return; if (!fn.interval) pendingTimers.delete(id); fn(); },
  rpc(id, response) {
    const target = pending.get(id); if (!target) return;
    clearTimeout(target.timer); pending.delete(id);
    if (response.ok) target.resolve(response.value);
    else target.reject(Object.assign(new Error(response.error?.message || 'Android WebView 操作失败。'), { code: response.error?.code || 'PAGE_CHANGED', status: response.error?.status || 502 }));
  },
};
try {
  initDashboard();
  NativeBridge.ready();
} catch (error) {
  // Native fallback remains usable even if the packaged UI cannot boot.
  NativeBridge.startupError?.(String(error?.message || '界面初始化失败').slice(0, 240));
  throw error;
}
