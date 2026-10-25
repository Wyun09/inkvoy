import { DeepSeekBrowser } from './core/browser.js';
import { MobileBuffer } from './platform.js';

// Runs in the DeepSeek WebView through evaluateJavascript, with no native
// JavascriptInterface installed in that remote page.
export async function locatorAction({ spec, action, argument }, evaluator) {
  if (location.origin !== 'https://chat.deepseek.com') throw new Error('UNEXPECTED_PAGE');
  const visible = element => {
    if (!element?.isConnected || !element.getClientRects().length) return false;
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  let nodes = [...document.querySelectorAll(spec.selector.replace(/:visible/g, ''))];
  if (spec.selector.includes(':visible')) nodes = nodes.filter(visible);
  if (spec.role) nodes = nodes.filter(element => (element.getAttribute('role') || (element.tagName === 'BUTTON' ? 'button' : '')) === spec.role);
  if (spec.pattern) {
    const pattern = new RegExp(spec.pattern.source, spec.pattern.flags);
    nodes = nodes.filter(element => pattern.test((spec.patternMode === 'text' ? element.innerText || '' : element.getAttribute('aria-label') || element.innerText || '').trim()));
  }
  if (action === 'count') return nodes.length;
  if (nodes.length !== 1) throw new Error('操作目标不唯一，已停止。');
  const element = nodes[0];
  if (action === 'visible') return visible(element);
  if (action === 'click') { element.click(); return true; }
  if (action === 'focus') { element.focus(); return true; }
  if (action === 'value') return element.value;
  if (action === 'fill') {
    if (!(element instanceof HTMLTextAreaElement)) throw new Error('输入目标不是文本框。');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(element, argument);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.focus();
    return true;
  }
  if (action === 'files') {
    if (!(element instanceof HTMLInputElement) || element.type !== 'file') throw new Error('上传入口无效。');
    const transfer = new DataTransfer();
    for (const file of argument) {
      const bytes = Uint8Array.from(atob(file.base64), char => char.charCodeAt(0));
      transfer.items.add(new File([bytes], file.name, { type: file.mimeType }));
    }
    element.files = transfer.files;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  if (action === 'evaluate') return await evaluator(element, argument);
  throw new Error('Unsupported locator action.');
}

class MobileLocator {
  constructor(page, spec) { this.page = page; this.spec = spec; }
  filter({ hasText }) { return new MobileLocator(this.page, { ...this.spec, patternMode: 'text', pattern: { source: hasText.source, flags: hasText.flags } }); }
  perform(action, argument, functionSource) { return this.page.evaluate(locatorAction, { spec: this.spec, action, argument, functionSource }); }
  count() { return this.perform('count'); }
  isVisible() { return this.perform('visible'); }
  click() { return this.perform('click'); }
  fill(value) { return this.perform('fill', value); }
  inputValue() { return this.perform('value'); }
  evaluate(fn, arg) {
    return this.page.rpc('evaluate', {
      source: `async function(args) { return await (${locatorAction.toString()})(args, (${fn.toString()})); }`,
      argument: { spec: this.spec, action: 'evaluate', argument: arg },
    });
  }
  async press(key) {
    if (key !== 'Enter') throw new Error('Unsupported key.');
    await this.perform('focus');
    await this.page.rpc('enter', {});
  }
  setInputFiles(files) { return this.perform('files', files.map(file => ({ name: file.name, mimeType: file.mimeType, base64: file.buffer.toString('base64') }))); }
}

export class MobilePage {
  constructor(rpc) { this.rpc = rpc; this.closed = false; }
  evaluate(fn, argument) { return this.rpc('evaluate', { source: fn.toString(), argument }); }
  goto(url) {
    const target = new URL(url);
    if (target.origin !== 'https://chat.deepseek.com') throw new Error('Only the DeepSeek origin is allowed.');
    return this.rpc('navigate', { url });
  }
  locator(selector) { return new MobileLocator(this, { selector }); }
  getByRole(role, { name }) { return new MobileLocator(this, { selector: '[role="button"], button', role, pattern: { source: name.source, flags: name.flags } }); }
  isClosed() { return this.closed; }
  bringToFront() { return this.rpc('showBrowser', {}); }
  setDefaultTimeout() {}
}

export class MobileBrowser extends DeepSeekBrowser {
  constructor(rpc, config = {}) {
    super({ profileDir: 'android-app-private-webview', timeoutMs: 600000, firstOutputTimeoutMs: 120000, pollMs: 100, ...config });
    this.rpc = rpc;
  }
  async _ensureBrowser() {
    if (!this._page || this._page.isClosed()) {
      this._page = new MobilePage(this.rpc);
      this._context = {};
    }
    return this._page;
  }
  async status() {
    await this._ensureBrowser();
    return super.status();
  }
  async _discardPage(page) {
    page.closed = true;
    if (this._page === page) this._page = null;
    await this.rpc('resetBrowser', {});
    this._context = null;
  }
  async _closeContext() {
    if (this._page) this._page.closed = true;
    this._page = null; this._context = null;
    await this.rpc('resetBrowser', {});
  }
  _watchUploadNetwork() {
    // Android WebView exposes no Playwright request stream. Require a longer
    // DOM-ready window together with the core's counts/names/progress checks.
    let earliest = Date.now() + 1200;
    return { quiet: () => Date.now() >= earliest, reset: () => { earliest = Date.now() + 1200; }, dispose() {} };
  }
}
