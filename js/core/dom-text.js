/**
 * Self-contained DOM reader, serialized by Playwright without app internals.
 * A single whole-answer code block is a lossless transport for its pre text.
 * The fallback is semantic DOM text, not a reconstruction of original Markdown.
 */
export function extractDomTexts({ selectors, inspectPage }) {
  const visible = element => {
    if (!element?.isConnected || !element.getClientRects().length) return false;
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  const ui = element => element.nodeType === 1 && (
    /^(?:BUTTON|SVG|SCRIPT|STYLE|NOSCRIPT)$/.test(element.tagName)
    || element.getAttribute('role') === 'button'
    || element.getAttribute('aria-hidden') === 'true'
    || element.hidden
    || element.matches('.md-code-block-banner-wrap, .md-code-block-banner, .code-info-button-text')
  );
  const semantic = (root, excluded = null) => {
    const tokens = [];
    const boundary = count => tokens.push({ boundary: count });
    const visit = node => {
      if (node === excluded) return;
      if (node.nodeType === 3) {
        const value = node.nodeValue || '';
        // Formatting indentation between block nodes is not answer content.
        if (/^[\t\n\r ]+$/.test(value) && /[\n\r]/.test(value)
          && /^(?:DIV|UL|OL|SECTION)$/.test(node.parentElement?.tagName || '')) return;
        tokens.push({ text: value });
        return;
      }
      if (node.nodeType !== 1 || ui(node)) return;
      if (node.tagName === 'BR') { boundary(1); return; }
      if (node.tagName === 'PRE') {
        boundary(2);
        tokens.push({ text: node.textContent || '' });
        boundary(2);
        return;
      }
      const block = /^(?:P|DIV|SECTION|BLOCKQUOTE|H[1-6]|UL|OL|LI|TABLE|TR)$/.test(node.tagName);
      if (block) boundary(node.tagName === 'LI' || node.tagName === 'TR' ? 1 : 2);
      for (const child of node.childNodes) visit(child);
      if (block) boundary(node.tagName === 'LI' || node.tagName === 'TR' ? 1 : 2);
    };
    for (const child of root.childNodes) visit(child);
    let text = '';
    let pendingBreak = 0;
    for (const token of tokens) {
      if (token.boundary) { pendingBreak = Math.max(pendingBreak, token.boundary); continue; }
      if (!token.text) continue;
      if (text && pendingBreak) {
        const existing = /\n*$/.exec(text)[0].length;
        text += '\n'.repeat(Math.max(0, pendingBreak - existing));
      }
      text += token.text;
      pendingBreak = 0;
    }
    return text;
  };
  const results = {};
  const selected = {};
  if (inspectPage) {
    const allVisible = selector => [...document.querySelectorAll(selector)].filter(visible);
    const textOf = element => (element.innerText || element.textContent || '').replace(/\r\n/g, '\n');
    const topLevel = selector => [...document.querySelectorAll(selector)]
      .filter(element => !element.parentElement?.closest(selector));
    const answerSelector = inspectPage.answerSelector;
    const answers = topLevel(answerSelector).filter(visible)
      .filter(element => !element.closest('.ds-think-content, [data-message-role="reasoning"], [data-role="reasoning"]'));
    let thoughts = topLevel('.ds-think-content');
    const answer = answers.length === 1 ? answers[0] : null;
    const message = answer?.closest('.ds-message');
    const wrapper = message?.parentElement;
    const wrapperAnswers = wrapper ? [...wrapper.querySelectorAll(answerSelector)]
      .filter(element => !element.parentElement?.closest(answerSelector)) : [];
    if (message) {
      const currentThoughts = thoughts.filter(element => message.contains(element));
      thoughts = currentThoughts.length ? currentThoughts
        : wrapperAnswers.length === 1 && wrapperAnswers[0] === answer ? thoughts.filter(element => wrapper.contains(element)) : [];
    }
    selected.answer = answers;
    selected.reasoning = thoughts;
    const allComposers = allVisible('textarea');
    const namedComposers = allComposers.filter(element => /DeepSeek/i.test(element.getAttribute('placeholder') || ''));
    const composers = namedComposers.length === 1 ? namedComposers : allComposers;
    const completionScope = wrapperAnswers.length === 1 && wrapperAnswers[0] === answer ? wrapper : null;
    const readAloud = completionScope ? [...completionScope.querySelectorAll('[aria-label]')]
      .filter(element => /^(?:朗读|Read aloud|播放语音)$/i.test(element.getAttribute('aria-label')?.trim())) : [];
    const alerts = allVisible('[role="alert"], .ds-toast, [data-testid="error-message"], [data-testid="input-error"]');
    const challenge = allVisible('[class*="captcha" i], [id*="captcha" i], [data-testid*="captcha" i], iframe[src*="captcha" i], iframe[title*="challenge" i], iframe[src*="challenges.cloudflare.com" i]');
    results.page = {
      originMatches: location.origin === inspectPage.origin,
      loginRequired: /^\/(?:sign_in|login)(?:\/|$)/.test(location.pathname)
        || allVisible('input[type="password"], input[autocomplete="one-time-code"]').length > 0
        || allVisible('[role="dialog"]').some(element => /登录|sign in|log in/i.test(textOf(element)) && element.querySelector('input')),
      needsVerification: challenge.length > 0 || allVisible('[role="dialog"], h1, h2').some(element => /人机验证|安全验证|请完成验证|verify (?:that )?you are human|verification required|checking your browser|just a moment/i.test(textOf(element))),
      composerCount: composers.length,
      composerSelector: namedComposers.length === 1 ? 'textarea[placeholder*="DeepSeek" i]:visible' : 'textarea:visible',
      composerTextLength: composers.length === 1 ? composers[0].value.length : 0,
      chatPath: location.pathname,
      messageCount: allVisible('.ds-message').length,
      answerCount: answers.length,
      reasoningCount: thoughts.length,
      completed: readAloud.some(visible),
      readAloudFound: readAloud.length > 0,
      readAloudRawCount: readAloud.length,
      readAloudVisibleCount: readAloud.filter(visible).length,
      siteError: alerts.some(element => /服务器繁忙|服务不可用|请求失败|网络错误|something went wrong|server is busy|network error|service unavailable/i.test(textOf(element))),
      contextLimit: alerts.some(element => /(?:消息|输入|内容|上下文).*(?:过长|太长|超过|超出)|超出.*(?:长度|上下文|字符|限制)|context (?:length|window)|too (?:long|many tokens)|maximum.*tokens/i.test(textOf(element))),
    };
  }
  for (const { key, selector, visibleOnly = true } of selectors) {
    const roots = selected[key] || [...document.querySelectorAll(selector)].filter(element => !visibleOnly || visible(element));
    if (roots.length !== 1) {
      results[key] = { text: '', source: 'missing', uncertain: true };
      continue;
    }
    const root = roots[0];
    const blocks = [...root.querySelectorAll('.md-code-block')]
      .filter(block => !block.parentElement?.closest('.md-code-block'));
    const pres = [...root.querySelectorAll('pre')];
    const wholeBlock = blocks.length === 1 ? blocks[0] : blocks.length === 0 && pres.length === 1 ? pres[0] : null;
    if (wholeBlock && !semantic(root, wholeBlock).trim()) {
      const codePres = wholeBlock.tagName === 'PRE' ? [wholeBlock] : [...wholeBlock.querySelectorAll('pre')];
      if (codePres.length <= 1) {
        const text = codePres[0]?.textContent || '';
        results[key] = { text, source: 'single_code_block', uncertain: !text.length };
        continue;
      }
    }
    const text = semantic(root);
    // Do not leak an opening fence/language while the renderer builds its pre.
    const fencePending = /^\s*`{3,}/.test(text);
    const markdown = root.matches('.ds-markdown') ? root : root.querySelector('.ds-markdown') || root;
    const contentNodes = [...markdown.childNodes].filter(node => node.nodeType === 3
      ? Boolean(node.nodeValue?.trim()) : node.nodeType === 1 && !ui(node));
    // Inline Markdown can re-render throughout its current paragraph. Earlier
    // completed blocks are safe to publish while that final block is mutable.
    const stableText = contentNodes.length ? semantic(root, contentNodes.at(-1)) : '';
    results[key] = { text: fencePending ? '' : text, stableText,
      source: fencePending ? 'fence_pending' : 'semantic_dom', uncertain: fencePending };
  }
  return results;
}

/** Only uncommitted tail changes are retractable. Committed edits always fail. */
export class BoundedTextTail {
  constructor({ maxChars = 32, maxHoldMs = 75 } = {}) {
    this.maxChars = maxChars;
    this.maxHoldMs = maxHoldMs;
    this.committed = '';
    this.pendingSince = null;
  }

  push(text, { now = Date.now(), final = false, protectedCode = false } = {}) {
    if (!text.startsWith(this.committed)) {
      const error = new Error('The webpage revised text that has already been streamed.');
      error.code = 'ANSWER_REVISED';
      error.status = 502;
      throw error;
    }
    if (text.length === this.committed.length) { this.pendingSince = null; return ''; }
    if (this.pendingSince === null) this.pendingSince = now;
    const flush = final || protectedCode || now - this.pendingSince >= this.maxHoldMs;
    let end = flush ? text.length : Math.max(this.committed.length, text.length - this.maxChars);
    if (protectedCode && !final) {
      // The renderer temporarily includes an unfinished closing fence inside
      // pre, then removes it when the delimiter is complete. Hold only that
      // ambiguous suffix, including its separator newline, never the answer.
      const closing = /(?:\n {0,3}`{0,5}|^`{1,5})$/.exec(text);
      if (closing) end = Math.max(this.committed.length, closing.index);
    }
    // Avoid sending half a UTF-16 surrogate pair when withholding a tail.
    if (end < text.length && end > this.committed.length
      && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    const delta = text.slice(this.committed.length, end);
    this.committed = text.slice(0, end);
    if (flush) this.pendingSince = null;
    return delta;
  }
}
