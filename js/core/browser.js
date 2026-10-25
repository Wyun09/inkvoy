import fs from 'node:fs/promises';
import path from 'node:path';
import { extractDomTexts, BoundedTextTail } from './dom-text.js';
import { reasoningControl } from './reasoning-control.js';
import { setTimeout, clearTimeout } from '../native-clock.js';

const ORIGIN = 'https://chat.deepseek.com';
const PROFILE_MARKER = '.deepseek-bridge-profile';
const ANSWER_SELECTOR = '.ds-markdown.ds-assistant-message-main-content';
const REASONING_NAME = /^(?:深度思考(?:\s*[（(][^）)]*[）)])?|DeepThink(?:\s*\([^)]*\))?)$/i;
const UPLOAD_ITEM_SELECTOR = '[data-testid="attachment"], [data-testid="file-preview"], [data-attachment], .ds-file-list-item, .ds-file-upload-item, .ds-attachment, .d5fa3d1b._183e647';

export class BrowserBridgeError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = 'BrowserBridgeError';
    this.code = code;
    this.status = status;
  }
}

function cancelled() {
  return new BrowserBridgeError('REQUEST_CANCELLED', 499, '请求已取消。');
}

function timedOut() {
  return new BrowserBridgeError('REQUEST_TIMEOUT', 504, '网页回答超时，请稍后重试。');
}

function checkRequest(signal, deadline) {
  if (signal?.aborted) throw cancelled();
  if (Date.now() >= deadline) throw timedOut();
}

async function within(promise, signal, deadline) {
  let timer;
  let abort;
  const interruption = new Promise((_, reject) => {
    const expire = () => {
      const remaining = deadline - Date.now();
      if (remaining > 0) timer = setTimeout(expire, remaining);
      else reject(timedOut());
    };
    if (Date.now() >= deadline) reject(timedOut());
    else timer = setTimeout(expire, Math.max(1, deadline - Date.now()));
    if (signal) {
      abort = () => reject(cancelled());
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
    }
  });
  try {
    return await Promise.race([promise, interruption]);
  } finally {
    clearTimeout(timer);
    if (abort) signal.removeEventListener('abort', abort);
  }
}

async function pause(ms, signal, deadline) {
  let timer;
  try {
    await within(new Promise(resolve => { timer = setTimeout(resolve, ms); }), signal, deadline);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Drives a dedicated browser profile through the visible DeepSeek UI.
 * No web cookies, tokens, network interception, or private web API are used.
 * The HTTP server must serialize generate() calls for this instance.
 */
export class DeepSeekBrowser {
  constructor(config = {}) {
    if (typeof config.profileDir !== 'string' || !config.profileDir.trim()) {
      throw new BrowserBridgeError('INVALID_PROFILE', 400, '需要配置专用浏览器资料目录。');
    }
    if (config.browserChannel && !['msedge', 'chrome'].includes(config.browserChannel)) {
      throw new BrowserBridgeError('INVALID_BROWSER', 400, '浏览器仅支持 msedge、chrome 或 Playwright Chromium。');
    }
    this.config = {
      profileDir: path.resolve(config.profileDir),
      browserChannel: config.browserChannel || undefined,
      headless: config.headless === true,
      timeoutMs: Number.isFinite(config.timeoutMs) ? Math.max(1000, config.timeoutMs) : 180_000,
      firstOutputTimeoutMs: Number.isFinite(config.firstOutputTimeoutMs) ? Math.max(100, config.firstOutputTimeoutMs) : 120_000,
      pollMs: Number.isFinite(config.pollMs) ? Math.max(20, Math.min(200, config.pollMs)) : 50,
      uploadTimeoutMs: Number.isFinite(config.uploadTimeoutMs) ? Math.max(1000, config.uploadTimeoutMs) : 60_000,
    };
    this._context = null;
    this._page = null;
    this._launching = null;
    this._active = false;
    this._activeRequest = null;
    this._closing = false;
    this._headless = undefined;
  }

  async _prepareProfile() {
    await fs.mkdir(this.config.profileDir, { recursive: true });
    const entries = await fs.readdir(this.config.profileDir);
    const marker = path.join(this.config.profileDir, PROFILE_MARKER);
    if (!entries.includes(PROFILE_MARKER)) {
      if (entries.length) {
        throw new BrowserBridgeError('UNSAFE_PROFILE', 400,
          '资料目录非空且不属于本项目。请使用新的空目录，不要指定日常浏览器资料目录。');
      }
      await fs.writeFile(marker, JSON.stringify({ purpose: 'deepseek-web-bridge', version: 1 }), { flag: 'wx', mode: 0o600 });
    } else {
      let metadata;
      try { metadata = JSON.parse(await fs.readFile(marker, 'utf8')); } catch { /* handled below */ }
      if (metadata?.purpose !== 'deepseek-web-bridge') {
        throw new BrowserBridgeError('UNSAFE_PROFILE', 400, '浏览器资料目录标记无效，请换一个专用空目录。');
      }
    }
  }

  async _ensureBrowser(headless = this.config.headless) {
    if (this._closing) throw new BrowserBridgeError('BROWSER_CLOSED', 503, '浏览器正在关闭。');
    if (this._launching) await this._launching;
    if (this._context && this._headless !== headless) await this._closeContext();
    if (!this._context) {
      this._launching = (async () => {
        try { await this._prepareProfile(); } catch (error) {
          if (error instanceof BrowserBridgeError) throw error;
          throw new BrowserBridgeError('PROFILE_UNAVAILABLE', 503, '无法准备专用浏览器资料目录，请检查目录写入权限。');
        }
        let context;
        try {
          const { chromium } = await import('playwright');
          context = await chromium.launchPersistentContext(this.config.profileDir, {
            channel: this.config.browserChannel,
            headless,
            viewport: null,
            acceptDownloads: false,
            timeout: 30_000,
          });
        } catch (error) {
          if (/SingletonLock|ProcessSingleton|user data directory is already in use|profile.*in use/i.test(String(error?.message))) {
            throw new BrowserBridgeError('PROFILE_IN_USE', 409, '专用浏览器资料目录正在使用，请关闭重复的项目进程后重试。');
          }
          throw new BrowserBridgeError('BROWSER_UNAVAILABLE', 503,
            '无法启动浏览器。请安装所选 Edge/Chrome，或执行 npx playwright install chromium。');
        }
        this._context = context;
        this._headless = headless;
        context.on('close', () => {
          if (this._context === context) {
            this._context = null;
            this._page = null;
          }
        });
      })();
      try { await this._launching; } finally { this._launching = null; }
    }
    if (!this._page || this._page.isClosed()) {
      const pages = this._context.pages();
      this._page = pages.find(page => page.url().startsWith(`${ORIGIN}/`))
        || pages.find(page => page.url() === 'about:blank')
        || await this._context.newPage();
      this._page.setDefaultTimeout(5000);
    }
    return this._page;
  }

  async _readState(page) {
    const extracted = await page.evaluate(extractDomTexts, {
      inspectPage: { origin: ORIGIN, answerSelector: ANSWER_SELECTOR, turn: this._turnBoundary },
      selectors: [
        { key: 'answer', selector: ANSWER_SELECTOR },
        { key: 'reasoning', selector: '.ds-think-content', visibleOnly: false },
      ],
    });
    const state = extracted.page;
    state.text = extracted.answer.text;
    state.textSource = extracted.answer.source;
    state.textUncertain = extracted.answer.uncertain;
    state.reasoningText = extracted.reasoning.text;
    state.reasoningStableText = extracted.reasoning.stableText;
    state.reasoningSource = extracted.reasoning.source;
    state.reasoningUncertain = extracted.reasoning.uncertain;
    return state;
  }

  _observeState(state) {
    if (this._activeRequest) Object.assign(this._activeRequest, {
      lastObservationMs: Date.now(),
      responseChars: state.text?.length || 0,
      reasoningChars: state.reasoningCount === 0 ? this._activeRequest.reasoningChars : (state.reasoningText?.length || 0),
      completedMarker: Boolean(state.completed),
      textareaChars: state.composerTextLength || 0,
      answerCount: state.answerCount || 0,
      readAloudFound: Boolean(state.readAloudFound),
      readAloudRawCount: state.readAloudRawCount || 0,
      readAloudVisibleCount: state.readAloudVisibleCount || 0,
    });
    return state;
  }

  async _readStateBounded(page, signal, deadline, readDeadline = Infinity) {
    const observationDeadline = Math.min(readDeadline, Date.now() + 5000);
    try {
      return this._observeState(await within(this._readState(page), signal, Math.min(deadline, observationDeadline)));
    } catch (error) {
      if (error?.code === 'REQUEST_TIMEOUT' && observationDeadline < deadline && Date.now() < deadline && !signal?.aborted) {
        throw new BrowserBridgeError('webpage_observation_timeout', 504, '网页状态读取未能在时限内完成（单次最多 5 秒），请检查专用浏览器。');
      }
      throw error;
    }
  }

  _checkState(state, prompt, { allowHistory = false, allowAmbiguous = false } = {}) {
    if (state.turnValid === false) throw new BrowserBridgeError('conversation_changed', 409, '网页历史在本轮生成时发生变化，已停止以避免混入旧回答。请重试或开始新会话。');
    if (!state.originMatches) {
      throw new BrowserBridgeError('UNEXPECTED_PAGE', 502, '浏览器离开了 DeepSeek 页面，请重新打开登录窗口。');
    }
    if (state.needsVerification) {
      throw new BrowserBridgeError('VERIFICATION_REQUIRED', 428, '网页要求人机验证，请在专用浏览器中手动完成后重试。');
    }
    if (state.loginRequired) {
      throw new BrowserBridgeError('LOGIN_REQUIRED', 401, 'DeepSeek 登录已失效，请打开专用浏览器重新登录。');
    }
    if (state.contextLimit) throw this._contextLengthError(prompt);
    if (state.siteError) {
      throw new BrowserBridgeError('UPSTREAM_ERROR', 502, 'DeepSeek 网页报告请求失败，请在浏览器中检查后重试。');
    }
    if (state.composerCount > 1 || (!allowHistory && !allowAmbiguous && (state.answerCount > 1 || state.reasoningCount > 1))) {
      throw this._ambiguousStateError(state);
    }
  }

  _ambiguousStateError(state) {
    const details = { phase: this._activeRequest?.phase || 'observing', answerContainers: state.answerCount || 0,
      reasoningContainers: state.reasoningCount || 0, composers: state.composerCount || 0 };
    const error = new BrowserBridgeError('PAGE_CHANGED', 502,
      `网页结构持续不明确（回答 ${details.answerContainers}、思考 ${details.reasoningContainers}、输入框 ${details.composers}），未混合不同回答。请检查页面适配器。`);
    error.details = details;
    return error;
  }

  _contextLengthError(prompt = '', acceptedPrompt = prompt) {
    const error = new BrowserBridgeError('context_length_exceeded', 400,
      `DeepSeek 网页拒绝了过长的输入；requested prompt 长度为 ${Array.from(prompt).length} 个字符，actual 网页输入长度为 ${Array.from(acceptedPrompt).length} 个字符。未截断或发送消息。`);
    error.promptLength = Array.from(prompt).length;
    error.promptUtf16Length = prompt.length;
    error.requestedLength = Array.from(prompt).length;
    error.actualLength = Array.from(acceptedPrompt).length;
    return error;
  }

  _activity() {
    return { active: this._active, activeRequest: this._activeRequest
      ? { ...this._activeRequest, elapsedMs: Date.now() - this._activeRequest.startedAtMs } : null };
  }

  async status() {
    if (!this._context) {
      return { browserOpen: false, loggedIn: false, needsVerification: false, ...this._activity(), message: '尚未打开专用浏览器。' };
    }
    if (!this._page || this._page.isClosed()) {
      return { browserOpen: true, loggedIn: false, needsVerification: false, ...this._activity(), message: '请打开专用浏览器登录页面。' };
    }
    try {
      const state = this._observeState(await within(this._readState(this._page), undefined, Date.now() + 5000));
      return {
        browserOpen: true,
        loggedIn: state.originMatches && !state.loginRequired && !state.needsVerification && state.composerCount === 1,
        needsVerification: state.needsVerification,
        ...this._activity(),
        ...(state.needsVerification ? { message: '请在专用浏览器中手动完成人机验证。' }
          : state.loginRequired ? { message: '请在专用浏览器中登录 DeepSeek。' } : {}),
      };
    } catch {
      return { browserOpen: Boolean(this._context), loggedIn: false, needsVerification: false, ...this._activity(), message: '无法读取网页状态，请重新打开登录窗口。' };
    }
  }

  async openLogin() {
    if (this._active) throw new BrowserBridgeError('BROWSER_BUSY', 409, '当前请求正在生成，请稍后打开登录窗口。');
    const page = await this._ensureBrowser(false);
    try {
      await page.goto(`${ORIGIN}/sign_in`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.bringToFront();
      return await this.status();
    } catch (error) {
      if (error instanceof BrowserBridgeError) throw error;
      throw new BrowserBridgeError('PAGE_UNAVAILABLE', 502, '无法打开 DeepSeek 登录页面，请检查网络。');
    }
  }

  async _newConversation(page, signal, deadline) {
    await within(page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded', timeout: Math.min(30_000, Math.max(1, deadline - Date.now())) }), signal, deadline);
    let clickedNewChat = false;
    let clearDeadline = deadline;
    for (;;) {
      checkRequest(signal, deadline);
      const state = await this._readStateBounded(page, signal, deadline);
      this._checkState(state, undefined, { allowHistory: true });
      if (state.composerCount === 1) {
        if (state.messageCount === 0 && state.answerCount === 0 && state.reasoningCount === 0) return state;
        if (!clickedNewChat) {
          const button = page.getByRole('button', { name: /^(?:开启新对话|新建对话|新对话|New chat)$/i });
          if (await button.count() === 1 && await button.isVisible()) {
            await within(button.click(), signal, deadline);
            clickedNewChat = true;
            clearDeadline = Math.min(deadline, Date.now() + 5000);
            await pause(this.config.pollMs, signal, deadline);
            continue;
          }
        }
        if (clickedNewChat && Date.now() < clearDeadline) {
          await pause(this.config.pollMs, signal, deadline);
          continue;
        }
        throw new BrowserBridgeError('CONVERSATION_NOT_EMPTY', 502, '无法确认已创建空白对话，已停止发送以避免历史混入。');
      }
      await pause(this.config.pollMs, signal, deadline);
    }
  }

  async _readReasoningMode(page) {
    return page.evaluate(reasoningControl, { action: 'read' });
  }

  async _setReasoning(page, enabled, signal, deadline) {
    return this._setPageToggle(page, 'reasoning', enabled, signal, deadline);
  }
  async _setPageToggle(page, feature, enabled, signal, deadline) {
    const label = feature === 'search' ? '智能搜索' : '深度思考';
    const errorCode = feature === 'search' ? 'web_search_state_unknown' : 'reasoning_state_unknown';
    let mode = await within(page.evaluate(reasoningControl, { action: 'read', waitMs: 1500, feature }), signal, deadline);
    if (mode.count !== 1 || typeof mode.enabled !== 'boolean') {
      throw new BrowserBridgeError(errorCode, 400,
        `无法确认${label}状态（找到 ${mode.count} 个控件，${mode.reason || '状态未暴露'}）。请在首页重新检测。`);
    }
    if (mode.enabled === enabled) return;
    checkRequest(signal, deadline);
    const changed = await within(page.evaluate(reasoningControl, { action: 'set', enabled, feature }), signal, deadline);
    if (!changed.clicked && !changed.alreadySet) {
      throw new BrowserBridgeError(errorCode, 400, `${label}开关不可操作或状态发生变化，已停止发送。`);
    }
    const modeDeadline = Math.min(deadline, Date.now() + 3000);
    while (Date.now() < modeDeadline) {
      mode = await within(page.evaluate(reasoningControl, { action: 'read', feature }), signal, deadline);
      if (mode.count === 1 && mode.enabled === enabled) return;
      await pause(this.config.pollMs, signal, deadline);
    }
    throw new BrowserBridgeError(errorCode, 400, `${label}开关切换后未能确认状态，已停止发送。`);
  }

  async _decodeImages(page, images, signal, deadline) {
    for (const image of images) {
      checkRequest(signal, deadline);
      let decoded;
      try { decoded = await within(page.evaluate(async ({ base64, mimeType }) => {
        if (typeof createImageBitmap !== 'function') return { ok: false, unavailable: true };
        try {
          const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
          const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
          const ok = bitmap.width > 0 && bitmap.height > 0;
          bitmap.close();
          return { ok };
        } catch { return { ok: false }; }
      }, { base64: image.buffer.toString('base64'), mimeType: image.mimeType }), signal, deadline); } catch (error) {
        if (signal?.aborted) throw cancelled();
        if (error?.code === 'REQUEST_TIMEOUT') {
          throw new BrowserBridgeError('image_decode_timeout', 400, '图片解码验证超时，未发送消息。');
        }
        throw new BrowserBridgeError('image_decode_failed', 400, '无法完成浏览器图片解码验证，未发送消息。');
      }
      if (!decoded.ok) {
        const error = new BrowserBridgeError(decoded.unavailable ? 'image_decode_unavailable' : 'invalid_image_data', 400,
          decoded.unavailable ? '浏览器不支持图片解码验证，已停止发送。'
            : `第 ${Number.isInteger(image.sourceIndex) ? image.sourceIndex + 1 : images.indexOf(image) + 1} 张图片无法完整解码，已停止发送。`);
        error.sourceIndex = image.sourceIndex;
        throw error;
      }
    }
  }

  async _readUploadState(page, images = []) {
    return page.evaluate(({ selector, names }) => {
      const visible = element => {
        if (!element?.isConnected || !element.getClientRects().length) return false;
        for (let node = element; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        }
        return true;
      };
      const namedImages = [...document.querySelectorAll('img[alt]')].filter(image => names.includes(image.alt));
      const candidates = [...new Set([...document.querySelectorAll(selector),
        ...namedImages.map(image => image.closest('[role="button"]')).filter(Boolean)])];
      const items = candidates.filter(visible)
        .filter(element => !element.parentElement?.closest(selector));
      let readyCount = 0;
      let pendingCount = 0;
      let failed = false;
      for (const item of items) {
        // opacity:0 upload overlays remain in the DOM and in innerText.
        // Read only text whose parent is effectively visible through ancestors.
        const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
        const visibleParts = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (visible(node.parentElement)) visibleParts.push(node.textContent);
        }
        const text = visibleParts.join(' ');
        const status = [item.getAttribute('data-state'), item.getAttribute('data-status')].filter(Boolean).join(' ');
        if (/error|fail/i.test(status) || /上传失败|解析失败|upload failed|failed to upload/i.test(text)) failed = true;
        const pending = /pending|uploading|processing|loading/i.test(status)
          || item.getAttribute('aria-busy') === 'true'
          || [...item.querySelectorAll('[role="progressbar"], progress, [aria-busy="true"], [class*="loading" i], [class*="uploading" i], [data-icon="spin"]')].some(visible)
          || /(?:^|\s)\d{1,3}%(?:\s|$)/.test(text)
          || /(?:上传中|解析中|正在上传|processing|uploading)(?:…|\.\.\.|$)/i.test(text);
        if (pending) pendingCount++;
        const thumbnails = [...item.querySelectorAll('img')].filter(visible);
        const decodedThumbnail = thumbnails.length > 0 && thumbnails.every(img => img.complete && img.naturalWidth > 0);
        const explicitReady = /^(?:ready|uploaded|complete|completed|success)$/i.test(status.trim());
        if (!pending && (decodedThumbnail || (explicitReady && thumbnails.length === 0))) readyCount++;
      }
      const alertFailure = [...document.querySelectorAll('[role="alert"], .ds-toast')].filter(visible)
        .some(element => /上传失败|解析失败|upload failed|failed to upload/i.test(element.innerText || ''));
      return { count: items.length, readyCount, pendingCount, failed: failed || alertFailure,
        names: items.flatMap(item => [...item.querySelectorAll('img[alt]')].map(image => image.alt)) };
    }, { selector: UPLOAD_ITEM_SELECTOR, names: images.map(image => image.name) });
  }

  _watchUploadNetwork(page) {
    const inFlight = new Set();
    let lastActivity = Date.now();
    const onRequest = request => {
      if (['websocket', 'eventsource'].includes(request.resourceType())) return;
      inFlight.add(request);
      lastActivity = Date.now();
    };
    const onFinished = request => {
      if (inFlight.delete(request)) lastActivity = Date.now();
    };
    page.on('request', onRequest);
    page.on('requestfinished', onFinished);
    page.on('requestfailed', onFinished);
    return {
      quiet: () => inFlight.size === 0 && Date.now() - lastActivity >= 400,
      reset: () => { lastActivity = Date.now(); },
      dispose: () => {
        page.off('request', onRequest);
        page.off('requestfinished', onFinished);
        page.off('requestfailed', onFinished);
      },
    };
  }

  async _uploadImages(page, images, signal, deadline) {
    const uploadDeadline = Math.min(deadline, Date.now() + this.config.uploadTimeoutMs);
    const input = page.locator('input[type="file"]');
    const network = this._watchUploadNetwork(page);
    let lastState = { count: 0, readyCount: 0 };
    try {
      if (await within(input.count(), signal, uploadDeadline) !== 1) {
        throw new BrowserBridgeError('image_upload_failed', 400, '网页上传入口不唯一或不存在，未发送消息。');
      }
      const multiple = await within(input.evaluate(element => element.multiple), signal, uploadDeadline);
      const groups = multiple ? [images] : images.map(image => [image]);
      let expectedCount = 0;
      for (const group of groups) {
        checkRequest(signal, uploadDeadline);
        network.reset();
        await within(input.setInputFiles(group.map(image => ({ name: image.name, mimeType: image.mimeType, buffer: image.buffer }))), signal, uploadDeadline);
        expectedCount += group.length;
        for (;;) {
          checkRequest(signal, uploadDeadline);
          this._checkState(await this._readStateBounded(page, signal, uploadDeadline));
          lastState = await within(this._readUploadState(page, images), signal, uploadDeadline);
          if (lastState.failed || lastState.count > expectedCount) {
            throw new BrowserBridgeError('image_upload_failed', 400, '网页图片上传失败或附件数量异常，未发送消息。');
          }
          const expectedNames = images.slice(0, expectedCount).map(image => image.name).sort();
          const actualNames = [...(lastState.names || [])].sort();
          if (lastState.count === expectedCount && lastState.readyCount === expectedCount
            && JSON.stringify(actualNames) === JSON.stringify(expectedNames)
            && lastState.pendingCount === 0 && network.quiet()) break;
          await pause(this.config.pollMs, signal, uploadDeadline);
        }
      }
    } catch (error) {
      if (signal?.aborted) throw cancelled();
      if (error?.code === 'REQUEST_TIMEOUT') {
        throw new BrowserBridgeError('image_upload_timeout', 400,
          `图片上传未能全部就绪（${lastState.readyCount}/${images.length}），未发送消息。`);
      }
      if (error instanceof BrowserBridgeError) throw error;
      throw new BrowserBridgeError('image_upload_failed', 400, '无法完成网页图片上传，未发送消息。');
    } finally {
      network.dispose();
    }
  }

  async _submitComposer(_page, composer, _options) { await composer.press('Enter'); }
  _phase(phase) { if (this._activeRequest) this._activeRequest.phase = phase; this._phaseListener?.(phase); }
  async _beforeSubmit(_page, _options) {}
  async _openConversation(page, _conversation, signal, deadline) { return this._newConversation(page, signal, deadline); }
  async _beginTurn(_page, _state, _options) {}
  async _completeTurn(_page, _state, _options) {}

  async _waitSubmission(page, before, prompt, signal, deadline) {
    const submissionDeadline = Math.min(deadline, Date.now() + 5000);
    while (Date.now() < submissionDeadline) {
      checkRequest(signal, deadline);
      let state;
      try {
        state = await this._readStateBounded(page, signal, deadline, submissionDeadline);
        this._checkState(state, prompt, { allowAmbiguous: true });
        const inputCleared = state.composerCount === 1 && state.composerTextLength === 0;
        const newMessage = state.messageCount > before.messageCount || state.answerCount > before.answerCount;
        const newChatPath = typeof state.chatPath === 'string' && state.chatPath !== before.chatPath
          && /^\/(?:a\/)?chat(?:\/|$)/.test(state.chatPath);
        if (inputCleared || newMessage || newChatPath) {
          this._phase('generating');
          return state;
        }
        await pause(this.config.pollMs, signal, submissionDeadline);
      } catch (error) {
        // A read begun just before this phase's deadline may reach the read
        // timeout wrapper first. It is still an unconfirmed submission, not
        // a separate observation failure; never submit the same prompt again.
        if (['REQUEST_TIMEOUT', 'webpage_observation_timeout'].includes(error?.code) && Date.now() >= submissionDeadline && !signal?.aborted) break;
        throw error;
      }
    }
    checkRequest(signal, deadline);
    throw new BrowserBridgeError('webpage_submission_failed', 400,
      '提交后 5 秒内网页未确认接收消息（输入未清空、没有新消息或新对话）。已停止，未重复提交。');
  }

  async *generate({ prompt, images = [], reasoning = false, webSearch, conversation, signal, onPhase, onSnapshot, stableOutput = false } = {}) {
    if (typeof prompt !== 'string' || !prompt.trim()) {
      throw new BrowserBridgeError('INVALID_PROMPT', 400, '消息内容不能为空。');
    }
    if (typeof reasoning !== 'boolean') {
      throw new BrowserBridgeError('invalid_reasoning', 400, 'reasoning 必须是布尔值。');
    }
    if (webSearch !== undefined && typeof webSearch !== 'boolean') throw new BrowserBridgeError('invalid_web_search', 400, 'web_search 必须是布尔值。');
    if (!Array.isArray(images) || images.some(image => !image || !Buffer.isBuffer(image.buffer)
      || !image.buffer.length || typeof image.name !== 'string' || !image.name
      || typeof image.mimeType !== 'string' || !image.mimeType.startsWith('image/'))) {
      throw new BrowserBridgeError('invalid_image_data', 400, '图片数据无效，未发送消息。');
    }
    if (this._active) throw new BrowserBridgeError('BROWSER_BUSY', 429, '浏览器已有请求正在生成。');
    this._active = true;
    this._phaseListener = onPhase;
    this._activeRequest = { startedAtMs: Date.now(), phase: 'opening_browser',
      promptLength: Array.from(prompt).length, imageCount: images.length, reasoning,
      lastObservationMs: 0, responseChars: 0, reasoningChars: 0,
      completedMarker: false, textareaChars: 0, answerCount: 0,
      readAloudFound: false, readAloudRawCount: 0, readAloudVisibleCount: 0 };
    const deadline = Date.now() + this.config.timeoutMs;
    let page;
    let started = false;
    let completed = false;
    try {
      checkRequest(signal, deadline);
      page = await within(this._ensureBrowser(), signal, deadline);
      this._phase(conversation?.reuse ? 'resuming_conversation' : 'new_conversation');
      const blank = await this._openConversation(page, conversation, signal, deadline);
      if (!blank?.reused && conversation?.fullPrompt) { prompt = conversation.fullPrompt; images = conversation.fullImages || images; }
      this._activeRequest.promptLength = Array.from(prompt).length;
      this._activeRequest.imageCount = images.length;
      this._phase('setting_reasoning');
      await this._setReasoning(page, reasoning, signal, deadline);
      if (images.length) {
        this._phase('decoding_images');
        await this._decodeImages(page, images, signal, deadline);
        this._phase('uploading_images');
        started = true;
        await this._uploadImages(page, images, signal, deadline);
      }
      const composer = page.locator(blank?.composerSelector || 'textarea:visible');
      checkRequest(signal, deadline);
      this._phase('filling_prompt');
      started = true;
      await within(composer.fill(prompt), signal, deadline);
      const accepted = await within(composer.inputValue(), signal, deadline);
      if (accepted !== prompt) throw this._contextLengthError(prompt, accepted);
      const beforeSubmission = await this._readStateBounded(page, signal, deadline);
      this._checkState(beforeSubmission, prompt, { allowHistory: blank?.reused === true });
      await this._setReasoning(page, reasoning, signal, deadline);
      await within(this._beforeSubmit(page, { reasoning, webSearch, signal, deadline }), signal, deadline);
      await within(this._beginTurn(page, beforeSubmission, { signal, deadline, conversation: blank?.reused ? conversation : undefined }), signal, deadline);
      this._phase('ready');
      yield { type: 'ready' };
      checkRequest(signal, deadline);
      this._phase('submitting');
      await within(this._submitComposer(page, composer, { prompt, signal, deadline }), signal, deadline);
      let pendingState = await this._waitSubmission(page, beforeSubmission, prompt, signal, deadline);
      const firstOutputDeadline = Math.min(deadline, Date.now() + this.config.firstOutputTimeoutMs);
      let sawOutput = false;
      let emitted = '';
      let emittedReasoning = '';
      const textTail = new BoundedTextTail();
      const reasoningTail = new BoundedTextTail();
      let previous = '';
      let previousReasoning = '';
      let latestReasoningRaw = '';
      let rawReasoningChangedAt = Date.now();
      let stableSince = Date.now();
      let missingTextSince = null;
      let missingReasoningSince = null;
      let ambiguousSince = null;
      let turnPendingSince = null;
      for (;;) {
        checkRequest(signal, deadline);
        const state = pendingState || await this._readStateBounded(page, signal, deadline);
        pendingState = null;
        this._checkState(state, prompt, { allowAmbiguous: true });
        if (state.turnPending) {
          turnPendingSince ??= Date.now();
          if (Date.now() - turnPendingSince >= 8000) throw new BrowserBridgeError('conversation_boundary_unavailable', 409, '网页重排后持续无法定位本轮回答。已保留本机记录，请在网页中检查当前回答后继续。');
          stableSince = Date.now();
          await pause(this.config.pollMs, signal, deadline);
          continue;
        }
        turnPendingSince = null;
        if (state.answerCount > 1 || state.reasoningCount > 1) {
          ambiguousSince ??= Date.now();
          if (Date.now() - ambiguousSince >= 1000) throw this._ambiguousStateError(state);
          stableSince = Date.now();
          await pause(this.config.pollMs, signal, deadline);
          continue;
        }
        ambiguousSince = null;
        if(state.searching){this._phase('searching');onSnapshot?.({content:previous,reasoning:latestReasoningRaw,phase:'searching'});}
        // Observe raw text too: the last thought paragraph may intentionally be
        // buffered for Markdown stability while the model is already working.
        if (state.text || state.reasoningText) sawOutput = true;
        if (!sawOutput && Date.now() >= firstOutputDeadline) {
          const error = new BrowserBridgeError('UPSTREAM_NO_OUTPUT', 504,
            `DeepSeek 网页受理后 ${this.config.firstOutputTimeoutMs / 1000} 秒内没有正文或思考输出。`);
          error.details = { phase: 'generating', firstOutputTimeoutMs: this.config.firstOutputTimeoutMs };
          throw error;
        }
        const textUncertain = state.textUncertain || (!state.text && previous.length > 0)
          || (state.textSource === 'single_code_block' && state.text.length < emitted.length && emitted.startsWith(state.text));
        if (textUncertain) {
          missingTextSince ??= Date.now();
          if ((previous || state.completed) && Date.now() - missingTextSince > (webSearch || state.generating ? 8000 : 500)) {
            throw new BrowserBridgeError('ANSWER_UNAVAILABLE', 502, '网页回答正文持续不可读取，已停止传输。');
          }
          stableSince = Date.now();
        } else missingTextSince = null;
        const text = textUncertain ? previous : state.text;
        // A collapsed thought pane may disappear; preserve already captured
        // reasoning instead of treating a UI collapse as a textual rewrite.
        const reasoningUncertain = state.reasoningCount > 0 && (state.reasoningUncertain
          || (!state.reasoningText && previousReasoning.length > 0));
        if (reasoningUncertain) {
          missingReasoningSince ??= Date.now();
          if (previousReasoning && Date.now() - missingReasoningSince > 500) {
            throw new BrowserBridgeError('reasoning_unavailable', 502, '网页思考内容持续不可读取，已停止传输。');
          }
        } else missingReasoningSince = null;
        if (state.reasoningCount > 0 && !reasoningUncertain && latestReasoningRaw !== (state.reasoningText || '')) {
          latestReasoningRaw = state.reasoningText || '';
          rawReasoningChangedAt = Date.now();
        }
        // The final paragraph can change as inline Markdown is closed. Stream
        // completed thought blocks while the answer streams. The webpage can
        // finish formatting its last thought paragraph even after body output
        // starts, so preserve and flush that exact paragraph at completion.
        const thinking = reasoningUncertain ? previousReasoning
          : state.reasoningCount === 0 ? previousReasoning
          : typeof state.reasoningStableText === 'string' ? state.reasoningStableText
          : latestReasoningRaw;
        if (text !== previous || thinking !== previousReasoning) stableSince = Date.now();
        // An in-app preview can replace a draft when Markdown changes. It is
        // separate from committed SSE/tool output and uses the same turn checks.
        if (onSnapshot && !textUncertain && !reasoningUncertain && (text !== previous || latestReasoningRaw !== previousReasoning)) onSnapshot({content:text,reasoning:latestReasoningRaw,phase:state.searching?'searching':'generating'});
        if (!stableOutput && !thinking.startsWith(emittedReasoning)) {
          throw new BrowserBridgeError('reasoning_revised', 502, '网页改写了已输出的思考内容，无法继续可靠传输。');
        }
        const reasoningDelta = reasoningUncertain || stableOutput ? '' : reasoningTail.push(thinking, {
          protectedCode: state.reasoningSource === 'single_code_block',
          final: Boolean(text && !emitted),
        });
        if (reasoningDelta) {
          const delta = reasoningDelta;
          emittedReasoning = reasoningTail.committed;
          yield { type: 'reasoning', delta };
        }
        if (!stableOutput && !text.startsWith(emitted)) {
          throw new BrowserBridgeError('ANSWER_REVISED', 502, '网页已改写输出过的正文，无法继续可靠流式传输，请重试。');
        }
        const textDelta = textUncertain || stableOutput ? '' : textTail.push(text, { protectedCode: state.textSource === 'single_code_block' });
        if (textDelta) {
          const delta = textDelta;
          emitted = textTail.committed;
          yield { type: 'text', delta };
        }
        if (state.completed && !textUncertain && !reasoningUncertain
          && Date.now() - stableSince >= Math.max(100, this.config.pollMs * 2)
          && Date.now() - rawReasoningChangedAt >= Math.max(150, this.config.pollMs * 2)) {
          if (!text.trim()) throw new BrowserBridgeError('EMPTY_RESPONSE', 502, '网页没有返回可识别的回答正文。');
          if (!stableOutput && !latestReasoningRaw.startsWith(emittedReasoning)) {
            throw new BrowserBridgeError('reasoning_revised', 502, '网页改写了已输出的思考内容，无法继续可靠传输。');
          }
          const finalReasoning = reasoningTail.push(latestReasoningRaw, { final: true });
          if (finalReasoning) yield { type: 'reasoning', delta: finalReasoning };
          const finalText = textTail.push(text, { final: true });
          if (finalText) yield { type: 'text', delta: finalText };
          completed = true;
          const handle = await within(this._completeTurn(page, state, { signal, deadline }), signal, deadline);
          yield { type: 'done', finishReason: 'stop', ...(handle ? { conversation: handle, reused: blank?.reused === true } : {}) };
          return;
        }
        previous = text;
        previousReasoning = thinking;
        await pause(this.config.pollMs, signal, deadline);
      }
    } catch (error) {
      if (error instanceof BrowserBridgeError) throw error;
      if (signal?.aborted) throw cancelled();
      if (Date.now() >= deadline) throw timedOut();
      if (page?.isClosed() || !this._context) {
        throw new BrowserBridgeError('BROWSER_CLOSED', 503, '专用浏览器已关闭，请重新打开登录窗口。');
      }
      throw new BrowserBridgeError('PAGE_CHANGED', 502, '无法可靠操作网页，页面可能已改版或网络中断。请检查专用浏览器。');
    } finally {
      // Closing this tab interrupts its UI work; the next request starts on a new
      // tab at the site root. Never let an abandoned response become a later reply.
      if (started && !completed && page) await this._discardPage(page);
      this._active = false;
      this._activeRequest = null;
      this._phaseListener = null;
    }
  }

  async _discardPage(page) {
    if (this._page === page) this._page = null;
    // Edge can close a persistent context asynchronously when its last tab is
    // closed. Clear and await that context before handing the queue to the next
    // request, rather than briefly exposing a stale closed browser object.
    const pages = this._context?.pages?.();
    if (pages && pages.filter(candidate => !candidate.isClosed()).every(candidate => candidate === page)) {
      await this._closeContext();
      return;
    }
    try {
      await within(page.close({ runBeforeUnload: false }), undefined, Date.now() + 5000);
    } catch {
      await this._closeContext();
    }
  }

  async _closeContext() {
    const context = this._context;
    this._context = null;
    this._page = null;
    this._headless = undefined;
    if (context) await context.close().catch(() => {});
  }

  async close() {
    this._closing = true;
    try {
      if (this._launching) await this._launching.catch(() => {});
      await this._closeContext();
    } finally {
      this._closing = false;
    }
  }
}
