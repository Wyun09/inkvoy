import {composerUploadState} from './upload-state.js';
import { DeepSeekBrowser, BrowserBridgeError } from './core/browser.js';
import { MobileBuffer } from './platform.js';
import { sendControl } from './send-control.js';
import { reasoningControl } from './core/reasoning-control.js';
import { conversationDom } from './conversation-dom.js';
import { setTimeout } from './native-clock.js';

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
  if (action.startsWith('files.')) {
    if (!(element instanceof HTMLInputElement) || element.type !== 'file') throw new Error('上传入口无效。');
    const key='__dshFileTransfer';
    if(action==='files.begin'){if(argument.files.length>8)throw new Error('一次最多上传 8 张图片');element[key]={token:argument.token,validate:!!argument.validate,files:argument.files.map(f=>({...f,chunks:[],received:0}))};return true;}
    const transfer=element[key];if(!transfer||transfer.token!==argument.token)throw new Error('图片传输已失效，请重新发送');
    if(action==='files.abort'){delete element[key];return true;}
    if(action==='files.chunk'){const file=transfer.files[argument.index];if(!file||file.received!==argument.offset||argument.data.length>49152||file.received+argument.data.length>file.length||!/^[A-Za-z0-9+/=]*$/.test(argument.data))throw new Error('图片数据分段不完整');file.chunks.push(argument.data);file.received+=argument.data.length;return file.received;}
    if(action==='files.commit'){try{const data=new DataTransfer();for(const file of transfer.files){if(file.received!==file.length)throw new Error('图片传输尚未完整');const bytes=Uint8Array.from(atob(file.chunks.join('')),c=>c.charCodeAt(0));const imageFile=new File([bytes],file.name,{type:file.mimeType});if(transfer.validate){try{if(typeof createImageBitmap==='function'){const bitmap=await createImageBitmap(imageFile);const valid=bitmap.width>0&&bitmap.height>0;bitmap.close();if(!valid)throw new Error('empty');}else{const url=URL.createObjectURL(imageFile);try{const image=new Image();image.src=url;await image.decode();if(!image.naturalWidth)throw new Error('empty');}finally{URL.revokeObjectURL(url);}}}catch{throw new Error('图片无法解码，未上传或发送消息');}}data.items.add(imageFile);}element.files=data.files;element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));return true;}finally{delete element[key];}}
    throw new Error('未知图片传输操作');
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
  async setInputFiles(files,{validateImages=false}={}) {
    const encoded=files.map(file=>({name:file.name,mimeType:file.mimeType,base64:file.buffer.toString('base64')}));
    if(!validateImages&&encoded.reduce((n,f)=>n+f.base64.length,0)<=49152)return this.perform('files',encoded);
    const token='files-'+crypto.randomUUID();let committed=false;
    try{await this.perform('files.begin',{token,validate:validateImages,files:encoded.map(({name,mimeType,base64})=>({name,mimeType,length:base64.length}))});
      for(const [index,file]of encoded.entries())for(let offset=0;offset<file.base64.length;offset+=49152)await this.perform('files.chunk',{token,index,offset,data:file.base64.slice(offset,offset+49152)});
      const result=await this.perform('files.commit',{token});committed=true;return result;
    }finally{if(!committed)await this.perform('files.abort',{token}).catch(()=>{});}
  }
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
  async searchEvidence(expected){if(!this._page||this._active)return {sources:[],sourceCards:0};const value=await this._readState(this._page);return value.text?.trim()===expected.trim()?{sources:value.sources||[],sourceCards:value.sourceCards||0}:{sources:[],sourceCards:0};}
  constructor(rpc, config = {}) {
    super({ profileDir: 'android-app-private-webview', timeoutMs: 600000, firstOutputTimeoutMs: 120000, pollMs: 180, ...config });
    this.rpc = rpc;
    this.sendControlTimeoutMs = Number.isFinite(config.sendControlTimeoutMs) ? Math.max(100, config.sendControlTimeoutMs) : 5000;
  }
  async _openConversation(page, conversation, signal, deadline) {
    this._turnBoundary = null;
    let current = await this._readStateBounded(page, signal, deadline);
    if (current.composerTextLength > 0) throw new BrowserBridgeError('conversation_has_draft', 409, '网页输入框还有未发送的内容，请先处理草稿后重试。');
    if (conversation?.reuse && /^\/(?:a\/)?chat\/(?:s\/)?[a-zA-Z0-9_-]+\/?$/.test(conversation.path || '')) {
      this._checkState(current, undefined, { allowHistory: true });
      if (current.chatPath !== conversation.path) {
        await page.goto('https://chat.deepseek.com' + conversation.path);
      }
      const restoreDeadline = Math.min(deadline, Date.now() + 3000);
      do {
        if (signal?.aborted) throw new BrowserBridgeError('REQUEST_CANCELLED', 499, '请求已取消。');
        try { current = await this._readStateBounded(page, signal, deadline, restoreDeadline); }
        catch (error) {
          if (error.code === 'webpage_observation_timeout' && Date.now() >= restoreDeadline && !signal?.aborted) break;
          throw error;
        }
        this._checkState(current, undefined, { allowHistory: true });
        if (current.composerTextLength > 0) throw new BrowserBridgeError('conversation_has_draft', 409, '该网页会话中还有未发送的草稿，请先处理后重试。');
        const snapshot = await page.evaluate(conversationDom, { action: 'inspect' });
        if (snapshot?.path === conversation.path
          && (snapshot.lastAnswer === conversation.lastAnswer || snapshot.lastAnswerLegacy === conversation.lastAnswer)
          && current.composerCount === 1) return { ...current, reused: true };
        await new Promise(resolve => setTimeout(resolve, Math.min(this.config.pollMs, Math.max(1, restoreDeadline - Date.now()))));
      } while (Date.now() < restoreDeadline);
      if (signal?.aborted) throw new BrowserBridgeError('REQUEST_CANCELLED', 499, '请求已取消。');
      if (Date.now() >= deadline) throw new BrowserBridgeError('REQUEST_TIMEOUT', 504, '网页会话恢复超时。');
      // Recovery failed before filling or clicking. A fresh conversation gets
      // the complete authoritative API history, not the continuation suffix.
    }
    return this._newConversation(page, signal, deadline);
  }
  async _beginTurn(page, _state, { conversation } = {}) {
    this._turnBoundary = await page.evaluate(conversationDom, { nonce: 'turn-' + crypto.randomUUID() });
    const snapshot = this._turnBoundary;
    const valid = snapshot && (conversation ? snapshot.path === conversation.path
      && [snapshot.answers.at(-1)?.signature, snapshot.answers.at(-1)?.legacySignature].includes(conversation.lastAnswer) : snapshot.answers.length === 0);
    if (!valid) {
      this._turnBoundary = null;
      throw new BrowserBridgeError('conversation_changed', 409, '发送前网页会话发生变化，已停止以避免混入旧历史。');
    }
  }
  async _completeTurn(page) {
    const snapshot = await page.evaluate(conversationDom, { action: 'inspect' });
    return /^\/(?:a\/)?chat\/(?:s\/)?[a-zA-Z0-9_-]+\/?$/.test(snapshot?.path || '') ? snapshot : undefined;
  }
  async _readState(page) {
    const state = await super._readState(page);
    if (this._turnBoundary && state.turnValid !== false && !this._turnBoundary.boundPath
      && /^\/(?:a\/)?chat\/(?:s\/)?[a-zA-Z0-9_-]+\/?$/.test(state.chatPath || '')) this._turnBoundary.boundPath = state.chatPath;
    return state;
  }
  async _beforeSubmit(page, { webSearch = true, reasoning, signal, deadline }) {
    await this._setPageToggle(page, 'search', webSearch, signal, deadline);
    const thought = await this._readReasoningMode(page);
    if (thought.count !== 1 || thought.enabled !== reasoning) throw new BrowserBridgeError('reasoning_search_conflict', 400, '智能搜索切换后思考状态发生变化，无法同时确认请求的设置，已停止发送。');
  }
  async _submitComposer(page, _composer, { prompt, signal, deadline }) {
    const stopAt = Math.min(deadline, Date.now() + this.sendControlTimeoutMs);
    const nonce = 'send-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    const reasons = { send_missing: '没有找到发送按钮', send_disabled: '发送按钮尚未启用', multiple_send_controls: '存在多个发送按钮',
      composer_missing: '输入框已消失', multiple_composers: '存在多个输入框', prompt_changed: '输入框内容已变化', generation_active: '网页正在处理另一条消息', unexpected_origin: '网页来源不匹配' };
    let state;
    while (Date.now() < stopAt) {
      if (signal?.aborted) throw new BrowserBridgeError('REQUEST_CANCELLED', 499, '请求已取消。');
      state = await page.evaluate(sendControl, { prompt, nonce });
      if (state.clicked) return;
      if (!['send_missing', 'send_disabled', 'composer_missing', 'generation_active'].includes(state.reason)) break;
      await new Promise(resolve => setTimeout(resolve, Math.min(this.config.pollMs, Math.max(1, stopAt - Date.now()))));
    }
    if (signal?.aborted) throw new BrowserBridgeError('REQUEST_CANCELLED', 499, '请求已取消。');
    const error = new BrowserBridgeError('webpage_send_control_unavailable', 400,
      `无法自动发送：${reasons[state?.reason] || '无法确认发送控件'}。已停止，未模拟回车或重复提交。`);
    error.details = { phase: 'submitting', sendControlReason: state?.reason || 'timeout', sendControlCount: state?.count || 0 };
    throw error;
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
    const status = await super.status();
    if (!status.loggedIn) {
      const unavailable = { count: 0, enabled: null, reason: status.needsVerification ? 'verification_required' : 'login_required' };
      return { ...status, reasoningMode: unavailable, webSearchMode: unavailable };
    }
    const result = { ...status };
    try { result.reasoningMode = await this._readReasoningMode(this._page); }
    catch { result.reasoningMode = { count: 0, enabled: null, reason: 'observation_failed' }; }
    try { result.webSearchMode = await this._page.evaluate(reasoningControl, { action: 'read', feature: 'search' }); }
    catch { result.webSearchMode = { count: 0, enabled: null, reason: 'observation_failed' }; }
    return result;
  }
  async openSavedSession(handle) {
    if (this._active) throw new BrowserBridgeError('BROWSER_BUSY', 409, '当前请求处理中，请稍后打开会话。');
    if (!/^\/(?:a\/)?chat\/(?:s\/)?[a-zA-Z0-9_-]+\/?$/.test(handle?.path || '')) throw new BrowserBridgeError('invalid_session', 400, '会话地址无效。');
    this._turnBoundary = null; const page = await this._ensureBrowser();
    await page.goto('https://chat.deepseek.com' + handle.path); await page.bringToFront();
  }
  async _discardPage(page) {
    this._turnBoundary = null;
    page.closed = true;
    if (this._page === page) this._page = null;
    await this.rpc('resetBrowser', {});
    this._context = null;
  }
  async _closeContext() {
    this._turnBoundary = null;
    if (this._page) this._page.closed = true;
    this._page = null; this._context = null;
    await this.rpc('resetBrowser', {});
  }
  async _decodeImages(_page,images,signal) {
    if(signal?.aborted)throw new BrowserBridgeError('REQUEST_CANCELLED',499,'图片上传已取消');
    for(const image of images)if(!image.buffer?.length||image.buffer.length>10*1024*1024)throw new BrowserBridgeError('invalid_image_data',400,'图片为空或超过 10 MiB。');
    // Pixel decoding occurs in the staged commit before any file change event.
  }
  async _readUploadState(page,images=[]) {return page.evaluate(composerUploadState,{names:images.map(i=>i.name),selector:this.uploadComposerSelector});}
  async _uploadImages(page,images,signal,deadline) {
    const stopAt=Math.min(deadline,Date.now()+this.config.uploadTimeoutMs);let last={count:0,readyCount:0},committedAt=0;
    const check=()=>{if(signal?.aborted)throw new BrowserBridgeError('REQUEST_CANCELLED',499,'图片上传已取消');if(Date.now()>=stopAt)throw new BrowserBridgeError('image_upload_timeout',400,'图片上传未能全部就绪（'+last.readyCount+'/'+images.length+'），未发送消息。');};
    const pause=()=>new Promise(resolve=>setTimeout(resolve,this.config.pollMs));
    check();const state=await this._readStateBounded(page,signal,stopAt);this.uploadComposerSelector=state.composerSelector;
    last=await this._readUploadState(page,images);if(!last.scopeVerified)throw new BrowserBridgeError('image_upload_scope',400,'无法识别本轮输入框的附件区域，未发送消息。');
    if(last.count)throw new BrowserBridgeError('image_upload_existing_draft',409,'网页输入框还有未发送的附件，请先处理后重试。');
    const locate=async()=>{check();const value=await page.evaluate(composerUploadState,{selector:this.uploadComposerSelector,mark:'upload-'+crypto.randomUUID()});if(!value.inputSelector)throw new BrowserBridgeError('image_upload_failed',400,value.error||'没有找到图片上传入口，未发送消息。');return page.locator(value.inputSelector);};
    let input=await locate();const multiple=await input.evaluate(e=>e.multiple),groups=multiple?[images]:images.map(i=>[i]);let expected=0;
    for(const group of groups){check();if(expected)input=await locate();await input.setInputFiles(group.map(i=>({name:i.name,mimeType:i.mimeType,buffer:i.buffer})),{validateImages:true});expected+=group.length;committedAt=Date.now();
      for(;;){check();this._checkState(await this._readStateBounded(page,signal,stopAt));last=await this._readUploadState(page,images);
        if(!last.scopeVerified||last.failed||last.count>expected)throw new BrowserBridgeError('image_upload_failed',400,'网页图片上传失败或附件区域已变化，未发送消息。');
        const wanted=images.slice(0,expected).map(i=>i.name),identities=last.names||[];
        if(last.count===expected&&last.readyCount===expected&&last.pendingCount===0&&identities.length+(last.anonymousCount||0)===expected&&identities.every(n=>wanted.includes(n))&&Date.now()-committedAt>=1200)break;
        if(!last.count&&Date.now()-committedAt>8000)throw new BrowserBridgeError('image_upload_preview_missing',400,'网页没有出现本轮图片的附件预览，未点击发送；可打开 DeepSeek 网页查看。');
        await pause();
      }
    }
  }
  _watchUploadNetwork() {
    // Android WebView exposes no Playwright request stream. Require a longer
    // DOM-ready window together with the core's counts/names/progress checks.
    let earliest = Date.now() + 1200;
    return { quiet: () => Date.now() >= earliest, reset: () => { earliest = Date.now() + 1200; }, dispose() {} };
  }
}
