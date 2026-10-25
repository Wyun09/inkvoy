// Backend deadlines use Android's Handler while UI libraries retain browser
// timers. Animations, xterm and toast callbacks must not round-trip through Java.
const browserSet = globalThis.setTimeout.bind(globalThis);
const browserClear = globalThis.clearTimeout.bind(globalThis);
const pending = new Map();
let sequence = 0;
export function setTimeout(fn, ms = 0, ...args) {
  if (!globalThis.NativeBridge?.timer) return browserSet(fn, ms, ...args);
  const id = ++sequence;
  pending.set(id, () => fn(...args));
  NativeBridge.timer(id, Math.max(0, Number(ms) || 0));
  return id;
}
export function clearTimeout(id) {
  if (!globalThis.NativeBridge?.timer) { browserClear(id); return; }
  pending.delete(id); NativeBridge.clearTimer(id);
}
export function fireTimer(id) { const fn = pending.get(id); if (!fn) return; pending.delete(id); fn(); }
